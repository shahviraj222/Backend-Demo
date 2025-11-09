import { Request, Response } from 'express'
import { supabase } from '../client'
import { standardSearchQuerySchema } from '../utils/sharedParsers'
import { z } from 'zod/v4'

const createBusinessUserFormSchema = z.object({
  business_id: z.string('Business ID is required'),
  user_id: z.string('User ID is required'),
  role: z.string('Role is required'),
})

export class BusinessMediaApi {
  private table = 'business_media'

  /**
   * Get all business media with optional filtering and pagination
   */
  async getBusinessMedia(req: Request, res: Response) {
    const { page, limit, search, sort_by, sort_order } = standardSearchQuerySchema.parse(
      req.query
    )

    const offset = (page - 1) * limit

    let query = supabase.from(this.table).select(
      `
        *,
        business:businesses(id, name)
      `,
      { count: 'exact' }
    )

    if (search) {
      query = query.or(
        `description.ilike.%${search}%,media_type.ilike.%${search}%,business.name.ilike.%${search}%`
      )
    }

    const { data, error, count } = await query
      .order(sort_by, { ascending: sort_order === 'asc' })
      .range(offset, offset + limit - 1)

    return res.status(error ? 400 : 200).json({
      data,
      error,
      meta: {
        count: count || 0,
        page: page,
        limit: limit,
        total_pages: Math.ceil((count || 0) / limit),
      },
    })
  }

  /**
   * Get business media by ID
   */
  async getBusinessMediaItem(req: Request, res: Response) {
    const { id } = req.params

    const { data, error } = await supabase
      .from(this.table)
      .select(
        `
        *,
        business:businesses(id, name)
      `
      )
      .eq('id', id)
      .single()

    return res.status(error ? 404 : 200).json({ data, error })
  }

  /**
   * Create new business media
   */
  async createBusinessMedia(req: Request, res: Response) {
    const body = createBusinessUserFormSchema.safeParse(req.body)
    if (body.error) {
      res.status(400).json({ data: null, error: body.error })
      return
    }

    const { data: businessMedia, error } = await supabase
      .from(this.table)
      .insert([body])
      .select(
        `
        *,
        business:businesses(id, name)
      `
      )
      .single()

    return res.status(error ? 400 : 201).json({ data: businessMedia, error })
  }

  /**
   * Update business media
   */
  async updateBusinessMedia(req: Request, res: Response) {
    const { id } = req.params
    const updates = createBusinessUserFormSchema.safeParse(req.body)
    if (updates.error) {
      res.status(400).json({ data: null, error: updates.error })
      return
    }
    const { ...updateData } = updates.data

    const { data: businessMedia, error } = await supabase
      .from(this.table)
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(
        `
        *,
        business:businesses(id, name)
      `
      )
      .single()

    return res.status(error ? 400 : 200).json({ data: businessMedia, error })
  }

  /**
   * Delete business media
   */
  async deleteBusinessMedia(req: Request, res: Response) {
    const { id } = req.params

    const { error } = await supabase.from(this.table).delete().eq('id', id)

    return res.status(error ? 400 : 200).json({ data: { id }, error })
  }

  /**
   * Get business media by business ID
   */
  async getBusinessMediaByBusiness(req: Request, res: Response) {
    const { businessId } = req.params
    const { page, limit, sort_by, sort_order } = standardSearchQuerySchema.parse(
      req.query
    )

    const offset = (page - 1) * limit

    const { data, error, count } = await supabase
      .from(this.table)
      .select(
        `
        *,
        business:businesses(id, name)
      `,
        { count: 'exact' }
      )
      .eq('business_id', businessId)
      .order(sort_by, { ascending: sort_order === 'asc' })
      .range(offset, offset + limit - 1)

    return res.status(error ? 400 : 200).json({
      data,
      error,
      meta: {
        count: count || 0,
        page: page,
        limit: limit,
        total_pages: Math.ceil((count || 0) / limit),
      },
    })
  }

  /**
   * Get business media by type
   */
  async getBusinessMediaByType(req: Request, res: Response) {
    const { mediaType } = req.params
    const { page, limit, sort_by, sort_order } = standardSearchQuerySchema.parse(
      req.query
    )

    const offset = (page - 1) * limit

    const { data, error, count } = await supabase
      .from(this.table)
      .select(
        `
        *,
        business:businesses(id, name)
      `,
        { count: 'exact' }
      )
      .eq('media_type', mediaType)
      .order(sort_by, { ascending: sort_order === 'asc' })
      .range(offset, offset + limit - 1)

    return res.status(error ? 400 : 200).json({
      data,
      error,
      meta: {
        count: count || 0,
        page: page,
        limit: limit,
        total_pages: Math.ceil((count || 0) / limit),
      },
    })
  }
}

export const businessMediaApi = new BusinessMediaApi()
