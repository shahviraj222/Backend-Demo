/**
 * API methods for services entity
 */
import { Request, Response } from 'express'

import { supabase } from '../client'
import { z } from 'zod/v4'
import { standardSearchQuerySchema } from '../utils/sharedParsers'

const createServiceFormSchema = z.object({
  business_id: z.string('Business ID is required'),
  name: z.string('Service name is required'),
  description: z.string('Invalid description').optional(),
  service_type: z.string('Invalid service type').optional(),
  duration_minutes: z.number('Invalid duration').optional(),
  price: z.number('Invalid price').optional(),
  currency: z.string('Invalid currency').optional(),
  required_role: z
    .enum(['user', 'staff', 'admin', 'owner'], 'Invalid required role')
    .optional(),
  allowed_user_ids: z.array(z.string(), 'Invalid user IDs').optional(),
})

export class ServicesController {
  private static table = 'services'

  /**
   * Get services for a business
   */
  static async getBusinessServices(req: Request, res: Response) {
    const { businessId } = req.params
    const { search } = req.query

    let query = supabase
      .from(ServicesController.table)
      .select(`
        id,
        name,
        description,
        service_type,
        duration_minutes,
        price,
        room,
        chair,
        currency,
        created_at,
        is_active,
        business_id!inner (
          id,
          name,
          owner_id
        )
      `)
      .eq('business_id.id', businessId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (search && typeof search === 'string') {
      query = query.ilike('name', `%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }

    res.status(200).json({ data })
  }

  /**
   * Get all services (admin view)
   */
  static async getAllServices(req: Request, res: Response) {
    const { page, limit, search } = standardSearchQuerySchema.parse(req.query)
    const offset = (page - 1) * limit

    let query = supabase
      .from(ServicesController.table)
      .select(
        `
        *,
        businesses(name, category)
      `,
        { count: 'exact' }
      )
      .eq('is_active', true)

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data, error, count } = await query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

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
   * Get service by ID
   */
  static async getService(req: Request, res: Response) {
    const { id } = req.params

    const { data, error } = await supabase
      .from(ServicesController.table)
      .select(
        `
        *,
        businesses(name, category)
      `
      )
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        res.status(404).json({ error: 'Service not found' })
        return
      }
      res.status(500).json({ error: error.message })
      return
    }

    res.status(200).json({ data })
  }

  /**
   * Create new service
   */
  static async createService(req: Request, res: Response) {
    const payload = createServiceFormSchema.safeParse(req.body)
    if (payload.error) {
      res.status(400).json({ data: null, error: payload.error })
      return
    }
    const data = payload.data

    const { data: service, error } = await supabase
      .from(ServicesController.table)
      .insert([
        {
          ...data,
          is_active: true,
        },
      ])
      .select()
      .single()

    if (error) {
      res.status(400).json({ error: error.message })
      return
    }

    res.status(201).json({ data: service })
  }

  /**
   * Update service
   */
  static async updateService(req: Request, res: Response) {
    const { id } = req.params
    const payload = createServiceFormSchema.safeParse(req.body)
    if (payload.error) {
      res.status(400).json({ data: null, error: payload.error })
      return
    }
    const updateData = payload.data

    const { data: service, error } = await supabase
      .from(ServicesController.table)
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        res.status(404).json({ error: 'Service not found' })
        return
      }
      res.status(400).json({ error: error.message })
      return
    }

    res.status(200).json({ data: service })
  }

  /**
   * Delete service (soft delete by setting is_active to false)
   */
  static async deleteService(req: Request, res: Response) {
    const { id } = req.params

    const { error } = await supabase
      .from(ServicesController.table)
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }

    res.status(200).json({ id })
  }

  /**
   * Search services by type or name
   */
  static async searchServices(req: Request, res: Response) {
    const { limit, search, serviceType } = standardSearchQuerySchema
      .extend({ serviceType: z.string().optional() })
      .parse(req.query)

    let queryBuilder = supabase
      .from(ServicesController.table)
      .select(
        `
        *,
        businesses(name, category)
      `
      )
      .eq('is_active', true)

    if (search) {
      queryBuilder = queryBuilder.or(
        `name.ilike.%${search}%,description.ilike.%${search}%`
      )
    }

    if (serviceType) {
      queryBuilder = queryBuilder.eq('service_type', serviceType)
    }

    const { data, error } = await queryBuilder
      .limit(limit)
      .order('created_at', { ascending: false })

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }

    res.status(200).json({ data })
  }
}
