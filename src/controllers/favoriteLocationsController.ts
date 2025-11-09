/**
 * API methods for favorite locations entity
 */
import { Request, Response } from 'express'

import { supabase } from '../client'
import { standardSearchQuerySchema } from '../utils/sharedParsers'
import { z } from 'zod/v4'

const createFavoriteLocationFormSchema = z.object({
  user_id: z.string('User ID is required'),
  nickname: z.string('Nickname is required'),
  address: z.string('Address is required'),
  latitude: z.number('Invalid latitude').optional(),
  longitude: z.number('Invalid longitude').optional(),
  country: z.string('Country is required'),
})

class FavoriteLocationsApi {
  /**
   * Get all favorite locations with optional filtering and pagination
   */
  static async getFavoriteLocations(req: Request, res: Response) {
    const { page, limit, search, sort_by, sort_order } = standardSearchQuerySchema.parse(
      req.query
    )
    const offset = (page - 1) * limit

    let query = supabase.from('favorite_locations').select(
      `
        *,
        user:profiles(id, full_name, email)
      `,
      { count: 'exact' }
    )

    if (search) {
      query = query.or(
        `nickname.ilike.%${search}%,address.ilike.%${search}%,country.ilike.%${search}%,user.full_name.ilike.%${search}%`
      )
    }

    const { data, error, count } = await query
      .order(sort_by, { ascending: sort_order === 'asc' })
      .range(offset, offset + limit - 1)

    const response = {
      data,
      error,
      meta: {
        count: count || 0,
        page: page,
        limit: limit,
        total_pages: Math.ceil((count || 0) / limit),
      },
    }

    res.status(error ? 400 : 200).json(response)
  }

  /**
   * Get favorite location by ID
   */
  static async getFavoriteLocation(req: Request, res: Response) {
    const { id } = req.params

    const { data, error } = await supabase
      .from('favorite_locations')
      .select(
        `
        *,
        user:profiles(id, full_name, email)
      `
      )
      .eq('id', id)
      .single()

    res.status(error ? 404 : 200).json({ data, error })
  }

  /**
   * Create new favorite location
   */
  static async createFavoriteLocation(req: Request, res: Response) {
    const userId = req.user?.id
    const payload = createFavoriteLocationFormSchema.safeParse(req.body)
    if (payload.error) {
      res.status(400).json({ data: null, error: payload.error })
      return
    }

    const { data: favoriteLocation, error } = await supabase
      .from('favorite_locations')
      .insert([{ ...payload, user_id: userId }])
      .select(
        `
        *,
        user:profiles(id, full_name, email)
      `
      )
      .single()

    res.status(error ? 400 : 201).json({ data: favoriteLocation, error })
  }

  /**
   * Update favorite location
   */
  static async updateFavoriteLocation(req: Request, res: Response) {
    const { id } = req.params
    const { data: updates, error: parseError } =
      createFavoriteLocationFormSchema.safeParse(req.body)

    if (parseError) {
      res.status(400).json({ data: null, error: parseError })
      return
    }
    
    const { data: favoriteLocation, error } = await supabase
      .from('favorite_locations')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(
        `
        *,
        user:profiles(id, full_name, email)
      `
      )
      .single()

    res.status(error ? 400 : 200).json({ data: favoriteLocation, error })
  }

  /**
   * Delete favorite location
   */
  static async deleteFavoriteLocation(req: Request, res: Response) {
    const { id } = req.params
    const { error } = await supabase.from('favorite_locations').delete().eq('id', id)

    res.status(error ? 400 : 200).json({ data: { id }, error })
  }

  /**
   * Get favorite locations by user ID
   */
  static async getFavoriteLocationsByUser(req: Request, res: Response) {
    const { userId } = req.params
    const { page, limit, sort_by, sort_order } = standardSearchQuerySchema.parse(
      req.query
    )
    const offset = (page - 1) * limit

    const { data, error, count } = await supabase
      .from('favorite_locations')
      .select(
        `
        *,
        user:profiles(id, full_name, email)
      `,
        { count: 'exact' }
      )
      .eq('user_id', userId)
      .order(sort_by, { ascending: sort_order === 'asc' })
      .range(offset, offset + limit - 1)

    const response = {
      data,
      error,
      meta: {
        count: count || 0,
        page: page,
        limit: limit,
        total_pages: Math.ceil((count || 0) / limit),
      },
    }

    res.status(error ? 400 : 200).json(response)
  }

  /**
   * Get favorite locations by country
   */
  static async getFavoriteLocationsByCountry(req: Request, res: Response) {
    const { country } = req.params
    const { page, limit, sort_by, sort_order } = standardSearchQuerySchema.parse(
      req.query
    )
    const offset = (page - 1) * limit

    const { data, error, count } = await supabase
      .from('favorite_locations')
      .select(
        `
        *,
        user:profiles(id, full_name, email)
      `,
        { count: 'exact' }
      )
      .eq('country', country)
      .order(sort_by, { ascending: sort_order === 'asc' })
      .range(offset, offset + limit - 1)

    const response = {
      data,
      error,
      meta: {
        count: count || 0,
        page: page,
        limit: limit,
        total_pages: Math.ceil((count || 0) / limit),
      },
    }

    res.status(error ? 400 : 200).json(response)
  }

  /**
   * Get favorite locations near coordinates
   */
  static async getFavoriteLocationsNear(req: Request, res: Response) {
    // const { latitude, longitude } = req.params
    const { page, limit, sort_by, sort_order } = standardSearchQuerySchema.parse(
      req.query
    )
    const offset = (page - 1) * limit

    // Using PostGIS ST_DWithin for distance calculation (assuming PostGIS is enabled)
    const { data, error, count } = await supabase
      .from('favorite_locations')
      .select(
        `
        *,
        user:profiles(id, full_name, email)
      `,
        { count: 'exact' }
      )
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .order(sort_by, { ascending: sort_order === 'asc' })
      .range(offset, offset + limit - 1)

    // Note: For production, you'd want to use PostGIS ST_DWithin function
    // This is a simplified version for demonstration
    const response = {
      data,
      error,
      meta: {
        count: count || 0,
        page: page,
        limit: limit,
        total_pages: Math.ceil((count || 0) / limit),
      },
    }

    res.status(error ? 400 : 200).json(response)
  }

  /**
   * Get current user's favorite locations
   */
  static async getUserFavoriteLocations(req: Request, res: Response) {
    const userId = req.user?.id
    const { page, limit, sort_by, sort_order } = standardSearchQuerySchema.parse(
      req.query
    )
    const offset = (page - 1) * limit

    const { data, error, count } = await supabase
      .from('favorite_locations')
      .select(
        `
        *,
        user:profiles(id, full_name, email)
      `,
        { count: 'exact' }
      )
      .eq('user_id', userId)
      .order(sort_by, { ascending: sort_order === 'asc' })
      .range(offset, offset + limit - 1)

    const response = {
      data,
      error,
      meta: {
        count: count || 0,
        page: page,
        limit: limit,
        total_pages: Math.ceil((count || 0) / limit),
      },
    }

    res.status(error ? 400 : 200).json(response)
  }
}

export default FavoriteLocationsApi
