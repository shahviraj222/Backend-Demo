/**
 * API methods for profiles entity
 */
import { Request, Response } from 'express'

import { supabase } from '../client'
import { standardSearchQuerySchema } from '../utils/sharedParsers'
import { z } from 'zod/v4'

const createProfileFormSchema = z.object({
  full_name: z.string('Invalid full name').optional(),
  email: z.string('Invalid email').optional(),
  phone: z.string('Invalid phone').optional(),
  avatar_url: z.string('Invalid avatar URL').optional(),
  country_code: z.string('Invalid country code').optional(),
  is_guest: z.boolean('Invalid is_guest flag').optional(),
})

class ProfilesApi {
  /**
   * Get all profiles with optional filtering and pagination
   */
  static async getProfiles(req: Request, res: Response) {
    const { page, limit, search, sort_by, sort_order } = standardSearchQuerySchema.parse(
      req.query
    )
    const offset = (page - 1) * limit

    let query = supabase.from('profiles').select('*', { count: 'exact' })

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
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
   * Get profile by ID
   */
  static async getProfile(req: Request, res: Response) {
    const { id } = req.params

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()

    res.status(error ? 404 : 200).json({ data, error })
  }

  /**
   * Create new profile
   */
  static async createProfile(req: Request, res: Response) {
    const payload = createProfileFormSchema.safeParse(req.body)
    if (payload.error) {
      res.status(400).json({ data: null, error: payload.error })
      return
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .insert([payload.data])
      .select()
      .single()

    res.status(error ? 400 : 201).json({ data: profile, error })
  }

  /**
   * Update profile
   */
  static async updateProfile(req: Request, res: Response) {
    const { id } = req.params
    const payload = createProfileFormSchema.safeParse(req.body)
    if (payload.error) {
      res.status(400).json({ data: null, error: payload.error })
      return
    }
    const updates = payload.data

    const { data: profile, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    res.status(error ? 400 : 200).json({ data: profile, error })
  }

  /**
   * Delete profile
   */
  static async deleteProfile(req: Request, res: Response) {
    const { id } = req.params
    const { error } = await supabase.from('profiles').delete().eq('id', id)

    res.status(error ? 400 : 200).json({ data: { id }, error })
  }

  /**
   * Get profile by email
   */
  static async getProfileByEmail(req: Request, res: Response) {
    const { email } = req.params

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single()

    res.status(error ? 404 : 200).json({ data, error })
  }

  /**
   * Get profile by phone
   */
  static async getProfileByPhone(req: Request, res: Response) {
    const { phone } = req.params

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('phone', phone)
      .single()

    res.status(error ? 404 : 200).json({ data, error })
  }

  /**
   * Get guest profiles
   */
  static async getGuestProfiles(req: Request, res: Response) {
    const { page, limit, sort_by, sort_order } = standardSearchQuerySchema.parse(
      req.query
    )
    const offset = (page - 1) * limit

    const { data, error, count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .eq('is_guest', true)
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
   * Get full account profiles
   */
  static async getFullProfiles(req: Request, res: Response) {
    const { page, limit, sort_by, sort_order } = standardSearchQuerySchema.parse(
      req.query
    )
    const offset = (page - 1) * limit

    const { data, error, count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .eq('is_guest', false)
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
   * Get current user's profile
   */
  static async getCurrentProfile(req: Request, res: Response) {
    const userId = req.user?.id

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    res.status(error ? 404 : 200).json({ data, error })
  }

  /**
   * Update current user's profile
   */
  static async updateCurrentProfile(req: Request, res: Response) {
    const userId = req.user?.id
    const payload = createProfileFormSchema.safeParse(req.body)
    if (payload.error) {
      res.status(400).json({ data: null, error: payload.error })
      return
    }
    const updates = payload.data

    const { data: profile, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single()

    res.status(error ? 400 : 200).json({ data: profile, error })
  }

  /**
   * Delete current user's profile
   */
  static async deleteCurrentProfile(req: Request, res: Response) {
    const userId = req.user?.id
    const { error } = await supabase.from('profiles').delete().eq('id', userId)

    res.status(error ? 400 : 200).json({ data: { id: userId }, error })
  }
}

export default ProfilesApi
