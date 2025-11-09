/**
 * Database entity types for the business management platform
 */

export type BusinessRole = 'user' | 'staff' | 'manager' | 'owner' | 'superadmin'

export interface Profile {
  id: string
  full_name?: string
  email?: string
  phone?: string
  avatar_url?: string
  country_code?: string
  is_guest: boolean
  auth_user_id?: string // Links to Supabase auth.users when profile is claimed
  created_at: string
  updated_at: string
}

export interface Business {
  id: string
  owner_id: string
  name: string
  description?: string
  logo_url?: string
  category?: string
  location?: Record<string, unknown>
  business_hours?: Record<string, unknown>
  address?: string
  city?: string
  state?: string
  zip_code?: string
  country: string
  phone?: string
  email?: string
  website?: string
  created_at: string
  updated_at: string
}

export interface BusinessUser {
  id: string
  business_id: string
  user_id: string
  role: BusinessRole
  created_at: string
  updated_at: string
}

export interface BusinessMedia {
  id: string
  business_id: string
  media_url: string
  media_type: string
  description?: string
  created_at: string
  updated_at: string
}

export interface Review {
  id: string
  user_id: string
  business_id: string
  rating?: number
  comment?: string
  created_at: string
  updated_at: string
}

export interface Favorite {
  id: string
  user_id: string
  business_id: string
  created_at: string
}

export interface FavoriteLocation {
  id: string
  user_id: string
  nickname: string
  address: string
  latitude?: number
  longitude?: number
  country: string
  created_at: string
  updated_at: string
}

// API Response types
export interface ApiResponse<T> {
  data: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  limit: number
  total_pages: number
}

// Form types
export interface CreateProfileForm {
  full_name?: string
  email?: string
  phone?: string
  avatar_url?: string
  country_code?: string
  is_guest?: boolean
}

export interface UpdateProfileForm extends Partial<CreateProfileForm> {
  id: string
}

export interface CreateBusinessForm {
  name: string
  description?: string
  logo_url?: string
  category?: string
  location?: Record<string, unknown>
  business_hours?: Record<string, unknown>
  address?: string
  city?: string
  state?: string
  zip_code?: string
  country?: string
  phone?: string
  email?: string
  website?: string
}

export interface UpdateBusinessForm extends Partial<CreateBusinessForm> {
  id: string
}

// Business Users Form Types
export interface CreateBusinessUserForm {
  business_id: string
  user_id: string
  role: BusinessRole
}

export interface UpdateBusinessUserForm extends Partial<CreateBusinessUserForm> {
  id: string
}

// Business Media Form Types
export interface CreateBusinessMediaForm {
  business_id: string
  media_url: string
  media_type: string
  description?: string
}

export interface UpdateBusinessMediaForm extends Partial<CreateBusinessMediaForm> {
  id: string
}

// Reviews Form Types
export interface CreateReviewForm {
  user_id: string
  business_id: string
  rating?: number
  comment?: string
  title?: string
  is_verified?: boolean
}

export interface UpdateReviewForm extends Partial<CreateReviewForm> {
  id: string
}

// Favorites Form Types
export interface CreateFavoriteForm {
  user_id: string
  business_id: string
}

// Favorite Locations Form Types
export interface CreateFavoriteLocationForm {
  user_id: string
  nickname: string
  address: string
  latitude?: number
  longitude?: number
  country: string
}

export interface UpdateFavoriteLocationForm extends Partial<CreateFavoriteLocationForm> {
  id: string
}
