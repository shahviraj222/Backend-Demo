/**
 * API methods for favorites entity
 */
import { Request, Response } from 'express'

import { supabase } from '../client'
import { standardSearchQuerySchema } from '../utils/sharedParsers'
import { z } from 'zod/v4'

const createFavoriteFormSchema = z.object({
  user_id: z.string('User ID is required'),
  business_id: z.string('Business ID is required'),
})

class FavoritesApi {
  /**
   * Get all favorites with optional filtering and pagination
   */
  static async getFavorites(req: Request, res: Response) {
    const { page, limit, search, sort_by, sort_order } = standardSearchQuerySchema.parse(
      req.query
    )
    const offset = (page - 1) * limit

    let query = supabase.from('favorites').select(
      `
        *,
        business:businesses(id, name, category, address, city),
        user:profiles(id, full_name, email)
      `,
      { count: 'exact' }
    )

    if (search) {
      query = query.or(`business.name.ilike.%${search}%,user.full_name.ilike.%${search}%`)
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
   * Get favorite by ID
   */
  static async getFavorite(req: Request, res: Response) {
    const { id } = req.params

    const { data, error } = await supabase
      .from('favorites')
      .select(
        `
        *,
        business:businesses(id, name, category, address, city),
        user:profiles(id, full_name, email)
      `
      )
      .eq('id', id)
      .single()

    res.status(error ? 404 : 200).json({ data, error })
  }

  /**
   * Create new favorite
   */
  static async createFavorite(req: Request, res: Response) {
    const userId = req.user?.id
    const payload = createFavoriteFormSchema.safeParse(req.body)
    if (payload.error) {
      res.status(400).json({ data: null, error: payload.error })
      return
    }

    const { data: favorite, error } = await supabase
      .from('favorites')
      .insert([{ ...payload, user_id: userId }])
      .select(
        `
        *,
        business:businesses(id, name, category, address, city),
        user:profiles(id, full_name, email)
      `
      )
      .single()

    res.status(error ? 400 : 201).json({ data: favorite, error })
  }

  /**
   * Delete favorite
   */
  static async deleteFavorite(req: Request, res: Response) {
    const { id } = req.params
    const { error } = await supabase.from('favorites').delete().eq('id', id)

    res.status(error ? 400 : 200).json({ data: { id }, error })
  }

  /**
   * Get favorites by user ID
   */
  static async getFavoritesByUser(req: Request, res: Response) {
    const { userId } = req.params
    const { page, limit, sort_by, sort_order } = standardSearchQuerySchema.parse(
      req.query
    )
    const offset = (page - 1) * limit

    const { data, error, count } = await supabase
      .from('favorites')
      .select(
        `
        *,
        business:businesses(id, name, category, address, city),
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
   * Get favorites by business ID
   */
  static async getFavoritesByBusiness(req: Request, res: Response) {
    const { businessId } = req.params
    const { page, limit, sort_by, sort_order } = standardSearchQuerySchema.parse(
      req.query
    )
    const offset = (page - 1) * limit

    const { data, error, count } = await supabase
      .from('favorites')
      .select(
        `
        *,
        business:businesses(id, name, category, address, city),
        user:profiles(id, full_name, email)
      `,
        { count: 'exact' }
      )
      .eq('business_id', businessId)
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
   * Check if business is favorited by user
   */
  static async isFavorited(req: Request, res: Response) {
    const { userId, businessId } = req.params

    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('business_id', businessId)
      .single()

    res.status(error ? 400 : 200).json({ data: !!data, error })
  }

  /**
   * Toggle favorite status
   */
  static async toggleFavorite(req: Request, res: Response) {
    const { userId, businessId } = req.params

    const { data: existing } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('business_id', businessId)
      .single()

    if (existing) {
      // Remove favorite
      const { error } = await supabase.from('favorites').delete().eq('id', existing.id)

      res.status(error ? 400 : 200).json({ data: { favorited: false }, error })
    } else {
      // Add favorite
      const { data, error } = await supabase
        .from('favorites')
        .insert([{ user_id: userId, business_id: businessId }])
        .select()
        .single()

      res.status(error ? 400 : 201).json({ data: { favorited: true, ...data }, error })
    }
  }

  /**
   * Get current user's favorites
   */
  static async getUserFavorites(req: Request, res: Response) {
    const userId = req.user?.id
    const { page, limit, sort_by, sort_order } = standardSearchQuerySchema.parse(
      req.query
    )
    const offset = (page - 1) * limit

    const { data, error, count } = await supabase
      .from('favorites')
      .select(
        `
        *,
        business:businesses(id, name, category, address, city),
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
   * Check if current user has favorited a business
   */
  static async checkUserFavorite(req: Request, res: Response) {
    const userId = req.user?.id
    const { businessId } = req.params

    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('business_id', businessId)
      .single()

    res.status(error ? 400 : 200).json({ data: !!data, error })
  }

  /**
   * Toggle favorite status for current user
   */
  static async toggleUserFavorite(req: Request, res: Response) {
    const userId = req.user?.id
    const { businessId } = req.params

    const { data: existing } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('business_id', businessId)
      .single()

    if (existing) {
      // Remove favorite
      const { error } = await supabase.from('favorites').delete().eq('id', existing.id)

      res.status(error ? 400 : 200).json({ data: { favorited: false }, error })
    } else {
      // Add favorite
      const { data, error } = await supabase
        .from('favorites')
        .insert([{ user_id: userId, business_id: businessId }])
        .select()
        .single()

      res.status(error ? 400 : 201).json({ data: { favorited: true, ...data }, error })
    }
  }
}

export default FavoritesApi
