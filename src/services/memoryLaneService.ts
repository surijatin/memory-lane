import { supabase } from '../lib/supabase'
import { MemoryLane, Event } from '../types'
import { v4 as uuidv4 } from 'uuid'

export const memoryLaneService = {
  /**
   * Get all memory lanes for a specific user
   */
  async getUserMemoryLanes(userId: string): Promise<MemoryLane[]> {
    const { data, error } = await supabase
      .from('memory_lanes')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as MemoryLane[]
  },

  /**
   * Get a memory lane by ID
   */
  async getMemoryLaneById(id: string): Promise<MemoryLane | null> {
    const { data, error } = await supabase
      .from('memory_lanes')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // No rows returned
      throw error
    }
    return data as MemoryLane
  },

  /**
   * Create a new memory lane
   */
  async createMemoryLane(
    memoryLane: Omit<
      MemoryLane,
      | 'id'
      | 'created_at'
      | 'updated_at'
      | 'deleted_at'
      | 'date_range_start'
      | 'date_range_end'
    >
  ): Promise<MemoryLane> {
    const now = new Date().toISOString()
    // Generate a UUID for the new memory lane
    const id = uuidv4()

    const { data, error } = await supabase
      .from('memory_lanes')
      .insert([
        {
          id,
          ...memoryLane,
          created_at: now,
          updated_at: now,
        },
      ])
      .select()

    if (error) throw error
    return data[0] as MemoryLane
  },

  /**
   * Update an existing memory lane
   */
  async updateMemoryLane(
    id: string,
    updates: Partial<Omit<MemoryLane, 'id' | 'created_at' | 'deleted_at'>>
  ): Promise<MemoryLane> {
    const { data, error } = await supabase
      .from('memory_lanes')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .is('deleted_at', null)
      .select()

    if (error) throw error
    return data[0] as MemoryLane
  },

  /**
   * Soft delete a memory lane by ID
   */
  async deleteMemoryLane(id: string): Promise<void> {
    const { error } = await supabase
      .from('memory_lanes')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) throw error
  },

  /**
   * Hard delete a memory lane by ID (use with caution)
   */
  async hardDeleteMemoryLane(id: string): Promise<void> {
    const { error } = await supabase.from('memory_lanes').delete().eq('id', id)

    if (error) throw error
  },

  /**
   * Upload a cover image for a memory lane
   */
  async uploadCoverImage(file: File, memoryLaneId: string): Promise<string> {
    // Create a unique file name to prevent collisions
    const fileExt = file.name.split('.').pop()
    const fileName = `lane-${memoryLaneId}-cover-${Date.now()}.${fileExt}`
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
   * Set the cover image URL for a memory lane
   */
  async setCoverImage(id: string, imageUrl: string): Promise<MemoryLane> {
    return this.updateMemoryLane(id, { cover_image_url: imageUrl })
  },

  /**
   * Get events for a specific memory lane
   */
  async getMemoryLaneEvents(memoryLaneId: string): Promise<Event[]> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('memory_lane_id', memoryLaneId)
      .is('deleted_at', null)
      .order('order_position', { ascending: true })

    if (error) throw error
    return data as Event[]
  },

  /**
   * Calculate and update the date range for a memory lane based on its events
   */
  async updateDateRange(
    memoryLaneId: string
  ): Promise<{ start: string | null; end: string | null }> {
    try {
      // Fetch all events for this memory lane
      const events = await this.getMemoryLaneEvents(memoryLaneId)

      if (events.length === 0) {
        // If there are no events, clear the date range
        await this.updateMemoryLane(memoryLaneId, {
          date_range_start: null,
          date_range_end: null,
        })
        return { start: null, end: null }
      }

      // Extract and sort event dates
      const eventDates = events
        .map((event) => new Date(event.event_date))
        .sort((a, b) => a.getTime() - b.getTime())

      // Get earliest and latest dates
      const earliest = eventDates[0].toISOString()
      const latest = eventDates[eventDates.length - 1].toISOString()

      // Update the memory lane with the new date range
      await this.updateMemoryLane(memoryLaneId, {
        date_range_start: earliest,
        date_range_end: latest,
      })

      return { start: earliest, end: latest }
    } catch (error) {
      console.error('Error updating date range:', error)
      throw error
    }
  },

  /**
   * Format date range as a string for display
   */
  formatDateRange(
    startDate: string | null | undefined,
    endDate: string | null | undefined
  ): string {
    if (!startDate) return 'No events yet'

    const start = new Date(startDate)
    const end = endDate ? new Date(endDate) : start

    // If they're in the same month and year
    if (
      start.getFullYear() === end.getFullYear() &&
      start.getMonth() === end.getMonth()
    ) {
      return start.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    }

    // If they're in the same year
    if (start.getFullYear() === end.getFullYear()) {
      return `${start.toLocaleDateString('en-US', {
        month: 'long',
      })} - ${end.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })}`
    }

    // Different years
    return `${start.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    })} - ${end.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    })}`
  },
}
