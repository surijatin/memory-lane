import { supabase } from '../lib/supabase'
import { Memory, Image } from '../types'

export const memoryService = {
  /**
   * Get all memories for a specific user
   */
  async getUserMemories(userId: string): Promise<Memory[]> {
    const { data, error } = await supabase
      .from('memories')
      .select('*')
      .eq('user_id', userId)
      .order('memory_date', { ascending: false })

    if (error) throw error
    return data as Memory[]
  },

  /**
   * Get a memory by ID
   */
  async getMemoryById(id: string): Promise<Memory | null> {
    const { data, error } = await supabase
      .from('memories')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // No rows returned
      throw error
    }
    return data as Memory
  },

  /**
   * Create a new memory
   */
  async createMemory(
    memory: Omit<Memory, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Memory> {
    const { data, error } = await supabase
      .from('memories')
      .insert([
        {
          ...memory,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()

    if (error) throw error
    return data[0] as Memory
  },

  /**
   * Update an existing memory
   */
  async updateMemory(
    id: string,
    updates: Partial<Omit<Memory, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<Memory> {
    const { data, error } = await supabase
      .from('memories')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()

    if (error) throw error
    return data[0] as Memory
  },

  /**
   * Delete a memory by ID
   */
  async deleteMemory(id: string): Promise<void> {
    const { error } = await supabase.from('memories').delete().eq('id', id)

    if (error) throw error
  },

  /**
   * Get all images for a specific memory
   */
  async getMemoryImages(memoryId: string): Promise<Image[]> {
    const { data, error } = await supabase
      .from('images')
      .select('*')
      .eq('memory_id', memoryId)
      .order('order_position', { ascending: true })

    if (error) throw error

    // Add virtual is_primary property based on order_position
    return (data as Omit<Image, 'is_primary'>[]).map((img) => ({
      ...img,
      is_primary: img.order_position === 0,
    }))
  },

  /**
   * Upload a memory image to Supabase storage
   */
  async uploadMemoryImage(file: File, memoryId: string): Promise<string> {
    // Create a unique file name to prevent collisions
    const fileExt = file.name.split('.').pop()
    const fileName = `${memoryId}-${Date.now()}.${fileExt}`
    const filePath = `${fileName}`

    // Upload the file to the 'memories' bucket
    const { error: uploadError } = await supabase.storage
      .from('memories')
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type,
      })

    if (uploadError) throw uploadError

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('memories')
      .getPublicUrl(filePath)

    return urlData.publicUrl
  },

  /**
   * Add image to the images table
   */
  async addMemoryImage(
    memoryId: string,
    storagePath: string,
    altText?: string,
    isPrimary: boolean = false
  ): Promise<Image> {
    try {
      // Get the highest order position
      const { data: maxOrderData, error: maxOrderError } = await supabase
        .from('images')
        .select('order_position')
        .eq('memory_id', memoryId)
        .order('order_position', { ascending: false })
        .limit(1)

      if (maxOrderError) throw maxOrderError

      // Default order position (non-primary)
      let orderPosition =
        maxOrderData && maxOrderData.length > 0
          ? maxOrderData[0].order_position + 1
          : 1 // Start from 1 if no images

      // If primary, set position to 0 and shift others
      if (isPrimary) {
        orderPosition = 0

        // Shift all existing images up by one position
        const { data: images, error: fetchError } = await supabase
          .from('images')
          .select('id, order_position')
          .eq('memory_id', memoryId)

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

      const { data, error } = await supabase
        .from('images')
        .insert([
          {
            memory_id: memoryId,
            storage_path: storagePath,
            alt_text: altText,
            order_position: orderPosition,
            created_at: new Date().toISOString(),
          },
        ])
        .select()

      if (error) throw error

      // Add virtual is_primary property
      const result = data[0] as Omit<Image, 'is_primary'>
      return {
        ...result,
        is_primary: result.order_position === 0,
      } as Image
    } catch (error) {
      console.error('Error adding memory image:', error)
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
  async deleteMemoryImage(filename: string): Promise<void> {
    const { error } = await supabase.storage.from('memories').remove([filename])

    if (error) throw error
  },

  /**
   * Set an image as primary
   */
  async setPrimaryImage(imageId: string, memoryId: string): Promise<void> {
    try {
      // Get all images for this memory
      const { data: images, error: fetchError } = await supabase
        .from('images')
        .select('id, order_position')
        .eq('memory_id', memoryId)
        .order('order_position', { ascending: true })

      if (fetchError) throw fetchError

      // Update the target image to order_position 0 (making it primary)
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
