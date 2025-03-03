import { supabase } from '../lib/supabase'
import { Event, Image } from '../types'
import { v4 as uuidv4 } from 'uuid'
import { memoryLaneService } from './memoryLaneService'

export const eventService = {
  /**
   * Get an event by ID
   */
  async getEventById(id: string): Promise<Event | null> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // No rows returned
      throw error
    }
    return data as Event
  },

  /**
   * Create a new event
   */
  async createEvent(
    event: Omit<Event, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>
  ): Promise<Event> {
    const now = new Date().toISOString()
    // Generate a UUID for the new event
    const id = uuidv4()

    // If no order position is specified, get the max position and add 1
    if (!event.order_position) {
      const { data: maxOrderData, error: maxOrderError } = await supabase
        .from('events')
        .select('order_position')
        .eq('memory_lane_id', event.memory_lane_id)
        .is('deleted_at', null)
        .order('order_position', { ascending: false })
        .limit(1)

      if (maxOrderError) throw maxOrderError

      // Set order_position to 1 if no events exist, or max + 1 if they do
      event.order_position =
        maxOrderData && maxOrderData.length > 0
          ? maxOrderData[0].order_position + 1
          : 1
    }

    const { data, error } = await supabase
      .from('events')
      .insert([
        {
          id,
          ...event,
          created_at: now,
          updated_at: now,
        },
      ])
      .select()

    if (error) throw error

    // Update the memory lane date range
    try {
      await memoryLaneService.updateDateRange(event.memory_lane_id)
    } catch (err) {
      console.error('Error updating memory lane date range:', err)
      // Don't fail the event creation if the date range update fails
    }

    return data[0] as Event
  },

  /**
   * Update an existing event
   */
  async updateEvent(
    id: string,
    updates: Partial<Omit<Event, 'id' | 'created_at' | 'deleted_at'>>
  ): Promise<Event> {
    // Get the current event to find its memory_lane_id
    const currentEvent = await this.getEventById(id)
    if (!currentEvent) {
      throw new Error('Event not found')
    }

    const { data, error } = await supabase
      .from('events')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .is('deleted_at', null)
      .select()

    if (error) throw error

    // Update the memory lane date range if the event date was changed
    if (updates.event_date) {
      try {
        await memoryLaneService.updateDateRange(currentEvent.memory_lane_id)
      } catch (err) {
        console.error('Error updating memory lane date range:', err)
        // Don't fail the event update if the date range update fails
      }
    }

    return data[0] as Event
  },

  /**
   * Soft delete an event by ID
   */
  async deleteEvent(id: string): Promise<void> {
    // Get the current event to find its memory_lane_id
    const currentEvent = await this.getEventById(id)
    if (!currentEvent) {
      throw new Error('Event not found')
    }

    const { error } = await supabase
      .from('events')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) throw error

    // Update the memory lane date range
    try {
      await memoryLaneService.updateDateRange(currentEvent.memory_lane_id)
    } catch (err) {
      console.error('Error updating memory lane date range:', err)
      // Don't fail the event deletion if the date range update fails
    }
  },

  /**
   * Hard delete an event by ID (use with caution)
   */
  async hardDeleteEvent(id: string): Promise<void> {
    const { error } = await supabase.from('events').delete().eq('id', id)

    if (error) throw error
  },

  /**
   * Reorder events within a memory lane
   */
  async reorderEvents(
    memoryLaneId: string,
    eventOrders: { id: string; order_position: number }[]
  ): Promise<void> {
    // Update each event's order in a transaction
    const updatePromises = eventOrders.map(({ id, order_position }) => {
      return supabase
        .from('events')
        .update({
          order_position,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('memory_lane_id', memoryLaneId)
        .is('deleted_at', null)
    })

    // Execute all updates
    await Promise.all(updatePromises)
  },

  /**
   * Get all images for a specific event
   */
  async getEventImages(eventId: string): Promise<Image[]> {
    const { data, error } = await supabase
      .from('images')
      .select('*')
      .eq('event_id', eventId) // Updated from memory_id to event_id
      .order('order_position', { ascending: true })

    if (error) throw error

    // Add virtual is_primary property based on order_position
    return (data as Omit<Image, 'is_primary'>[]).map((img) => ({
      ...img,
      is_primary: img.order_position === 0,
    }))
  },

  /**
   * Upload an event image to Supabase storage
   */
  async uploadEventImage(file: File, eventId: string): Promise<string> {
    // Create a unique file name to prevent collisions
    const fileExt = file.name.split('.').pop()
    const fileName = `event-${eventId}-${Date.now()}.${fileExt}`
    const filePath = `${fileName}`

    // Upload the file to the 'memory-images' bucket
    const { error: uploadError } = await supabase.storage
      .from('memory-images')
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type,
      })

    if (uploadError) throw uploadError

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('memory-images')
      .getPublicUrl(filePath)

    return urlData.publicUrl
  },

  /**
   * Add image to the images table for an event
   */
  async addEventImage(
    eventId: string,
    imageUrl: string,
    altText?: string,
    isPrimary: boolean = false
  ): Promise<Image> {
    // Generate a UUID for the new image
    const id = uuidv4()

    try {
      // Get the highest order position and add 1
      const { data: maxOrderData, error: maxOrderError } = await supabase
        .from('images')
        .select('order_position')
        .eq('event_id', eventId)
        .order('order_position', { ascending: false })
        .limit(1)

      if (maxOrderError) throw maxOrderError

      // Default order position (non-primary)
      let orderPosition =
        maxOrderData && maxOrderData.length > 0
          ? maxOrderData[0].order_position + 1
          : 1 // Start from 1 if no images

      // If this should be primary, set position to 0 and shift others
      if (isPrimary) {
        // Set this image's position to 0 (will be primary)
        orderPosition = 0

        // Move all existing images up by one position
        const { error: shiftError } = await supabase.rpc(
          'shift_image_positions',
          {
            event_id_param: eventId,
          }
        )

        if (shiftError) {
          console.warn(
            'Error shifting positions, continuing with insert:',
            shiftError
          )
          // If RPC is not available, we'll handle it directly
          const { data: images, error: fetchError } = await supabase
            .from('images')
            .select('id, order_position')
            .eq('event_id', eventId)

          if (!fetchError && images) {
            // Update each image's position manually
            for (const img of images) {
              await supabase
                .from('images')
                .update({ order_position: img.order_position + 1 })
                .eq('id', img.id)
            }
          }
        }
      }

      // Now insert the new image
      const { data, error } = await supabase
        .from('images')
        .insert([
          {
            id,
            event_id: eventId,
            url: imageUrl,
            thumbnail_url: null, // We're not generating thumbnails for now
            alt_text: altText,
            order_position: orderPosition,
            created_at: new Date().toISOString(),
          },
        ])
        .select()

      if (error) throw error

      // Convert the database object to our Image type
      // by adding the is_primary virtual property based on order_position
      const result = data[0] as Omit<Image, 'is_primary'>
      return {
        ...result,
        is_primary: result.order_position === 0, // Virtual property
      } as Image
    } catch (error) {
      console.error('Error adding event image:', error)
      throw error
    }
  },

  /**
   * Delete an image by ID
   */
  async deleteImage(id: string): Promise<void> {
    const { error } = await supabase.from('images').delete().eq('id', id)

    if (error) throw error
  },

  /**
   * Delete an image from storage
   */
  async deleteEventImage(filename: string): Promise<void> {
    const { error } = await supabase.storage
      .from('memory-images')
      .remove([filename])

    if (error) throw error
  },

  /**
   * Set an image as primary for an event
   */
  async setPrimaryImage(imageId: string, eventId: string): Promise<void> {
    try {
      // Set all images for this event to have higher order positions
      const { data: images, error: fetchError } = await supabase
        .from('images')
        .select('id, order_position')
        .eq('event_id', eventId)
        .order('order_position', { ascending: true })

      if (fetchError) throw fetchError

      // Update the target image to have the lowest order position (0)
      const { error: updateError } = await supabase
        .from('images')
        .update({ order_position: 0 })
        .eq('id', imageId)

      if (updateError) throw updateError

      // Reorder all other images
      if (images && images.length > 0) {
        let position = 1
        for (const image of images) {
          if (image.id !== imageId) {
            await supabase
              .from('images')
              .update({ order_position: position++ })
              .eq('id', image.id)
          }
        }
      }
    } catch (error) {
      console.error('Error setting primary image:', error)
      throw error
    }
  },
}
