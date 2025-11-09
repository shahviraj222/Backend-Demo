import { Request, Response } from 'express'

import { supabase } from '../client'
import { standardSearchQuerySchema } from '../utils/sharedParsers'
import { z } from 'zod/v4'

const createReviewFormSchema = z.object({
  user_id: z.string('User ID is required'),
  business_id: z.string('Business ID is required'),
  rating: z.number('Invalid rating').optional(),
  comment: z.string('Invalid comment').optional(),
  title: z.string('Invalid title').optional(),
  is_verified: z.boolean('Invalid verification flag').optional(),
})

export class ReviewsController {
  private static table = 'reviews'

  /**
   * Get all reviews with optional filtering and pagination
   */
  static async getReviews(req: Request, res: Response) {
    const { page, limit, search, sort_by, sort_order } = standardSearchQuerySchema.parse(
      req.query
    )
    const offset = (page - 1) * limit

    let query = supabase.from(ReviewsController.table).select(
      `
        *,
        business:businesses(id, name),
        user:profiles(id, full_name, email)
      `,
      { count: 'exact' }
    )

    if (search) {
      query = query.or(
        `comment.ilike.%${search}%,business.name.ilike.%${search}%,user.full_name.ilike.%${search}%`
      )
    }

    const { data, error, count } = await query
      .order(sort_by, { ascending: sort_order === 'asc' })
      .range(offset, offset + limit - 1)

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }

    res.status(200).json({
      data,
      meta: {
        count: count || 0,
        page: page,
        limit: limit,
        total_pages: Math.ceil((count || 0) / limit),
      },
    })
  }

  /**
   * Get review by ID
   */
  static async getReview(req: Request, res: Response) {
    const { id } = req.params

    const { data, error } = await supabase
      .from(ReviewsController.table)
      .select(
        `
        *,
        business:businesses(id, name),
        user:profiles(id, full_name, email)
      `
      )
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        res.status(404).json({ error: 'Review not found' })
        return
      }
      res.status(500).json({ error: error.message })
      return
    }

    res.status(200).json({ data })
  }

  /**
   * Create new review
   */
  static async createReview(req: Request, res: Response) {
    const payload = createReviewFormSchema.safeParse(req.body)
    if (payload.error) {
      res.status(400).json({ data: null, error: payload.error })
      return
    }
    const data = payload.data

    const { data: review, error } = await supabase
      .from(ReviewsController.table)
      .insert([data])
      .select(
        `
        *,
        business:businesses(id, name),
        user:profiles(id, full_name, email)
      `
      )
      .single()

    if (error) {
      res.status(400).json({ error: error.message })
      return
    }

    res.status(201).json({ data: review })
  }

  /**
   * Update review
   */
  static async updateReview(req: Request, res: Response) {
    const { id } = req.params
    const data = createReviewFormSchema.safeParse(req.body)
    if (data.error) {
      res.status(400).json({ data: null, error: data.error })
      return
    }
    const updateData = data.data

    const { data: review, error } = await supabase
      .from(ReviewsController.table)
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(
        `
        *,
        business:businesses(id, name),
        user:profiles(id, full_name, email)
      `
      )
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        res.status(404).json({ error: 'Review not found' })
        return
      }
      res.status(400).json({ error: error.message })
      return
    }

    res.status(200).json({ data: review })
  }

  /**
   * Delete review
   */
  static async deleteReview(req: Request, res: Response) {
    const { id } = req.params

    const { error } = await supabase.from(ReviewsController.table).delete().eq('id', id)

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }

    res.status(200).json({ id })
  }

  /**
   * Get reviews by business ID
   */
  static async getReviewsByBusiness(req: Request, res: Response) {
    const { businessId } = req.params
    const { page, limit, sort_by, sort_order } = standardSearchQuerySchema.parse(
      req.query
    )
    const offset = (page - 1) * limit

    const { data, error, count } = await supabase
      .from(ReviewsController.table)
      .select(
        `
        *,
        business:businesses(id, name),
        user:profiles(id, full_name, email)
      `,
        { count: 'exact' }
      )
      .eq('business_id', businessId)
      .order(sort_by, { ascending: sort_order === 'asc' })
      .range(offset, offset + limit - 1)

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }

    res.status(200).json({
      data,
      meta: {
        count: count || 0,
        page: page,
        limit: limit,
        total_pages: Math.ceil((count || 0) / limit),
      },
    })
  }

  /**
   * Get reviews by user ID
   */
  static async getReviewsByUser(req: Request, res: Response) {
    const { userId } = req.params
    const { page, limit, sort_by, sort_order } = standardSearchQuerySchema.parse(
      req.query
    )
    const offset = (page - 1) * limit

    const { data, error, count } = await supabase
      .from(ReviewsController.table)
      .select(
        `
        *,
        business:businesses(id, name),
        user:profiles(id, full_name, email)
      `,
        { count: 'exact' }
      )
      .eq('user_id', userId)
      .order(sort_by, { ascending: sort_order === 'asc' })
      .range(offset, offset + limit - 1)

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }

    res.status(200).json({
      data,
      meta: {
        count: count || 0,
        page: page,
        limit: limit,
        total_pages: Math.ceil((count || 0) / limit),
      },
    })
  }

  /**
   * Get reviews by rating
   */
  static async getReviewsByRating(req: Request, res: Response) {
    const { rating } = req.params
    const ratingNum = parseInt(rating, 10)
    const { page, limit, sort_by, sort_order } = standardSearchQuerySchema.parse(
      req.query
    )
    const offset = (page - 1) * limit

    if (isNaN(ratingNum)) {
      res.status(400).json({ error: 'Rating must be a valid number' })
      return
    }

    const { data, error, count } = await supabase
      .from(ReviewsController.table)
      .select(
        `
        *,
        business:businesses(id, name),
        user:profiles(id, full_name, email)
      `,
        { count: 'exact' }
      )
      .eq('rating', ratingNum)
      .order(sort_by, { ascending: sort_order === 'asc' })
      .range(offset, offset + limit - 1)

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }

    res.status(200).json({
      data,
      meta: {
        count: count || 0,
        page: page,
        limit: limit,
        total_pages: Math.ceil((count || 0) / limit),
      },
    })
  }
}
