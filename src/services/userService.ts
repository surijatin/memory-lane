import { supabase } from '@/lib/supabase'
import { User } from '@/types'

export const userService = {
  /**
   * Get all users from the database
   */
  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('isActive', true)

    if (error) throw error
    return data as User[]
  },

  /**
   * Get a user by ID
   */
  async getUserById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // No rows returned
      throw error
    }
    return data as User
  },

  /**
   * Get a user by username
   */
  async getUserByUsername(username: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // No rows returned
      throw error
    }
    return data as User
  },

  /**
   * Upload an avatar image to Supabase storage
   */
  async uploadAvatar(file: File, username: string): Promise<string> {
    // Create a unique file name to prevent collisions
    const fileExt = file.name.split('.').pop()
    const fileName = `${username}-${Date.now()}.${fileExt}`
    const filePath = `${fileName}`

    // Upload the file to the 'avatars' bucket
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type,
      })

    if (uploadError) throw uploadError

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    return urlData.publicUrl
  },

  /**
   * Delete an avatar image from storage
   */
  async deleteAvatar(filename: string): Promise<void> {
    const { error } = await supabase.storage.from('avatars').remove([filename])

    if (error) throw error
  },

  /**
   * Create a new user
   */
  async createUser(user: Omit<User, 'id' | 'created_at'>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          ...user,
          isActive: true, // Set new users as active by default
          created_at: new Date().toISOString(),
        },
      ])
      .select()

    if (error) throw error
    return data[0] as User
  },

  /**
   * Update an existing user
   */
  async updateUser(
    id: string,
    updates: Partial<Omit<User, 'id' | 'created_at'>>
  ): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()

    if (error) throw error
    return data[0] as User
  },

  /**
   * Delete a user by ID
   */
  async deleteUser(id: string): Promise<void> {
    const { error } = await supabase.from('users').delete().eq('id', id)

    if (error) throw error
  },

  /**
   * Update user avatar
   */
  async updateAvatar(id: string, avatarPath: string): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update({ avatar_path: avatarPath })
      .eq('id', id)
      .select()

    if (error) throw error
    return data[0] as User
  },
}
