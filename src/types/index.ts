// Type definitions for the application

export interface User {
  // Primary identifier
  id: string // UUID from Supabase

  // Required fields
  username: string
  first_name: string
  last_name: string

  // Optional fields
  description?: string | null
  avatar_path?: string | null
  isActive?: boolean // Flag to indicate if the user is active

  // System fields
  created_at?: string // ISO date string
}

export interface MemoryLane {
  // Primary identifier
  id: string // UUID from Supabase

  // Foreign key
  user_id: string // References User.id

  // Required fields
  title: string

  // Optional fields
  description?: string | null
  cover_image_url?: string | null
  is_public: boolean

  // Date range of events
  date_range_start?: string | null // ISO date string of the earliest event
  date_range_end?: string | null // ISO date string of the latest event

  // System fields
  created_at?: string // ISO date string
  updated_at?: string // ISO date string
  deleted_at?: string | null // ISO date string
}

export interface Event {
  // Primary identifier
  id: string // UUID from Supabase

  // Foreign key
  memory_lane_id: string // References MemoryLane.id

  // Required fields
  title: string
  event_date: string // ISO date string
  order_position: number

  // Optional fields
  description?: string | null
  location?: string | null

  // System fields
  created_at?: string // ISO date string
  updated_at?: string // ISO date string
  deleted_at?: string | null // ISO date string
}

export interface Image {
  // Primary identifier
  id: string // UUID from Supabase

  // Foreign key
  event_id: string // References Event.id

  // Required fields
  url: string // The main image URL

  // Optional fields
  thumbnail_url?: string | null // Thumbnail version of the image
  alt_text?: string | null
  order_position: number // Position in the gallery (0 means primary)

  // Virtual properties (not in the database)
  is_primary?: boolean // Computed property (true if order_position === 0)

  // System fields
  created_at?: string // ISO date string
}

// Legacy interface - keeping for migration purposes
export interface Memory {
  // Primary identifier
  id: string // UUID from Supabase

  // Foreign key
  user_id: string // References User.id

  // Required fields
  title: string
  description: string
  memory_date: string // ISO date string

  // System fields
  created_at?: string // ISO date string
  updated_at?: string // ISO date string
}

// Add other types as needed
