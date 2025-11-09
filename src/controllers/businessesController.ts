/**
 * API methods for businesses entity
 */

import { Request, Response } from 'express'
import { supabase } from '../client'

import { z } from 'zod/v4'
import { standardPaginationQuerySchema } from '../utils/sharedParsers'

const createBusinessFormSchema = z.object({
  name: z.string('Name is required'),
  description: z.string().optional(),
  logo_url: z.string().optional(),
  category: z.string().optional(),
  location: z
    .record(z.string(), z.unknown(), { message: 'Invalid location format' })
    .optional(),
  business_hours: z
    .record(z.string(), z.unknown(), { message: 'Invalid business hours format' })
    .optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  website: z.string().optional(),
})

class BusinessesApi {
  /**
   * Get businesses for the current user
   */
  static async getUserBusinesses(req: Request, res: Response) {
    const userId = req.user?.id
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('owner_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      res.status(400).json({ data: [], error })
      return
    }

    res.status(200).json({ data, error })
  }

  /**
   * Get businesses by owner ID (matches frontend API pattern)
   */
  static async getBusinessesByOwner(req: Request, res: Response) {
    const { ownerId } = req.params
    
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('owner_id', ownerId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }

    res.status(200).json({ data })
  }

  /**
   * Get business by ID
   */
  static async getBusiness(req: Request, res: Response) {
    const { id } = req.params
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', id)
      .single()

    res.status(error ? 404 : 200).json({ data, error })
  }

  /**
   * Create new business
   */
  static async createBusiness(req: Request, res: Response) {
    const owner_id = req.user?.id
    const payload = createBusinessFormSchema.safeParse(req.body)
    if (payload.error) {
      res.status(400).json({ data: null, error: payload.error })
      return
    }

    const { data: business, error } = await supabase
      .from('businesses')
      .insert([{ ...payload.data, owner_id, is_active: true }])
      .select()
      .single()

    res.status(error ? 400 : 201).json({ data: business, error })
  }

  /**
   * Update business
   */
  static async updateBusiness(req: Request, res: Response) {
    const { id } = req.params
    const payload = createBusinessFormSchema
      .extend({ id: z.string() })
      .safeParse(req.body)
    if (payload.error) {
      res.status(400).json({ data: null, error: payload.error })
      return
    }

    const { data: business, error } = await supabase
      .from('businesses')
      .update({ ...payload.data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    res.status(error ? 400 : 200).json({ data: business, error })
  }

  /**
   * Delete business (soft delete by setting is_active to false)
   */
  static async deleteBusiness(req: Request, res: Response) {
    const { id } = req.params
    const { error } = await supabase
      .from('businesses')
      .update({ is_active: false })
      .eq('id', id)

    res.status(error ? 400 : 200).json({ data: { id }, error })
  }

  /**
   * Search businesses
   */
  static async searchBusinesses(req: Request, res: Response) {
    const { query, category, limit } = standardPaginationQuerySchema.parse(req.query)

    let queryBuilder = supabase.from('businesses').select('*').eq('is_active', true)

    if (query) {
      queryBuilder = queryBuilder.or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    }

    if (category) {
      queryBuilder = queryBuilder.eq('category', category)
    }

    const { data, error } = await queryBuilder
      .limit(Number(limit))
      .order('created_at', { ascending: false })

    res.status(error ? 400 : 200).json({ data, error })
  }

  /**
   * Get business categories
   */
  static async getBusinessCategories(_req: Request, res: Response) {
    const { data, error } = await supabase
      .from('businesses')
      .select('category')
      .not('category', 'is', null)
      .eq('is_active', true)

    if (error) {
      res.status(400).json({ data: [], error })
      return
    }

    const categories = [...new Set(data.map(item => item.category))]
    res.status(200).json({ data: categories, error: null })
  }
}

export default BusinessesApi
