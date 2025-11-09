import { Request, Response } from 'express'
import { supabase } from '../client'
import { standardSearchQuerySchema } from '../utils/sharedParsers'
import { z } from 'zod/v4'

const createBusinessUserFormSchema = z.object({
  business_id: z.string('Business ID is required'),
  user_id: z.string('User ID is required'),
  role: z.enum(['user', 'staff', 'admin', 'owner'], 'Invalid role').default('staff'),
})

class BusinessUsersApi {
  static table = 'business_users'

  static async getBusinessUsers(req: Request, res: Response) {
    const { page, limit, search, sort_by, sort_order } = standardSearchQuerySchema.parse(
      req.query
    )

    const offset = (page - 1) * limit

    let query = supabase.from(BusinessUsersApi.table).select(
      `
        *,
        business:businesses(id, name),
        user:profiles!business_users_user_id_fkey(id, full_name, email)
      `,
      { count: 'exact' }
    )

    if (search) {
      query = query.or(
        `business.name.ilike.%${search}%,user.full_name.ilike.%${search}%,user.email.ilike.%${search}%`
      )
    }

    const { data, error, count } = await query
      .order(sort_by, { ascending: sort_order === 'asc' })
      .range(offset, offset + limit - 1)

    res.status(error ? 400 : 200).json({
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

  static async getBusinessUser(req: Request, res: Response) {
    const { id } = req.params

    const { data, error } = await supabase
      .from(BusinessUsersApi.table)
      .select(
        `
        *,
        business:businesses(id, name),
        user:profiles!business_users_user_id_fkey(id, full_name, email)
      `
      )
      .eq('id', id)
      .single()

    res.status(error ? 404 : 200).json({ data, error })
  }

  static async createBusinessUser(req: Request, res: Response) {
    const payload = createBusinessUserFormSchema.safeParse(req.body)
    if (payload.error) {
      res.status(400).json({ data: null, error: payload.error })
      return
    }

    const { data: businessUser, error } = await supabase
      .from(BusinessUsersApi.table)
      .insert([payload.data])
      .select(
        `
        *,
        business:businesses(id, name),
        user:profiles!business_users_user_id_fkey(id, full_name, email)
      `
      )
      .single()

    res.status(error ? 400 : 201).json({ data: businessUser, error })
  }

  static async updateBusinessUser(req: Request, res: Response) {
    const { id } = req.params
    const updates = createBusinessUserFormSchema.partial().safeParse(req.body)
    if (updates.error) {
      res.status(400).json({ data: null, error: updates.error })
      return
    }
    const updateData = updates.data

    const { data: businessUser, error } = await supabase
      .from(BusinessUsersApi.table)
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(
        `
        *,
        business:businesses(id, name),
        user:profiles!business_users_user_id_fkey(id, full_name, email)
      `
      )
      .single()

    res.status(error ? 400 : 200).json({ data: businessUser, error })
  }

  static async deleteBusinessUser(req: Request, res: Response) {
    const { id } = req.params

    const { error } = await supabase.from(BusinessUsersApi.table).delete().eq('id', id)

    res.status(error ? 400 : 200).json({ data: { id }, error })
  }

  static async getBusinessUsersByBusiness(req: Request, res: Response) {
    const { businessId } = req.params
    const { page, limit, sort_by, sort_order } = standardSearchQuerySchema.parse(
      req.query
    )

    const offset = (page - 1) * limit

    const { data, error, count } = await supabase
      .from(BusinessUsersApi.table)
      .select(
        `
        *,
        business:businesses(id, name),
        user:profiles!business_users_user_id_fkey(id, full_name, email)
      `,
        { count: 'exact' }
      )
      .eq('business_id', businessId)
      .order(sort_by, { ascending: sort_order === 'asc' })
      .range(offset, offset + limit - 1)

    res.status(error ? 400 : 200).json({
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

  static async getBusinessUsersByUser(req: Request, res: Response) {
    const { userId } = req.params
    const { page, limit, sort_by, sort_order } = standardSearchQuerySchema.parse(
      req.query
    )

    const offset = (page - 1) * limit

    const { data, error, count } = await supabase
      .from(BusinessUsersApi.table)
      .select(
        `
        *,
        business:businesses(id, name),
        user:profiles!business_users_user_id_fkey(id, full_name, email)
      `,
        { count: 'exact' }
      )
      .eq('user_id', userId)
      .order(sort_by, { ascending: sort_order === 'asc' })
      .range(offset, offset + limit - 1)

    res.status(error ? 400 : 200).json({
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

  static async getBusinessUsersByRole(req: Request, res: Response) {
    const { role } = req.params
    const { page, limit, sort_by, sort_order } = standardSearchQuerySchema.parse(
      req.query
    )

    const offset = (page - 1) * limit

    const { data, error, count } = await supabase
      .from(BusinessUsersApi.table)
      .select(
        `
        *,
        business:businesses(id, name),
        user:profiles!business_users_user_id_fkey(id, full_name, email)
      `,
        { count: 'exact' }
      )
      .eq('role', role)
      .order(sort_by, { ascending: sort_order === 'asc' })
      .range(offset, offset + limit - 1)

    res.status(error ? 400 : 200).json({
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
   * Get staff members for a business (matches frontend API pattern)
   */
  static async getBusinessStaff(req: Request, res: Response) {
    const { businessId } = req.params
    const { search } = req.query

    let query = supabase
      .from(BusinessUsersApi.table)
      .select(`
        id,
        role,
        created_at,
        user_id!inner (
          id,
          full_name,
          email,
          phone,
          country_code,
          created_at
        ),
        business_id!inner (
          id,
          name,
          owner_id
        )
      `)
      .eq('business_id.id', businessId)
      .eq('role', 'staff')
      .order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }

    // Transform data to match frontend API format
    const transformedData = data.map((item) => ({
      id: item.user_id.id,
      full_name: item.user_id.full_name,
      email: item.user_id.email,
      phone: item.user_id.phone,
      country_code: item.user_id.country_code,
      created_at: item.user_id.created_at,
      business: {
        id: item.business_id.id,
        name: item.business_id.name,
      },
    }))

    // Apply search filter if provided
    let filteredData = transformedData
    if (search && typeof search === 'string') {
      filteredData = transformedData.filter((staff) =>
        staff.full_name?.toLowerCase().includes(search.toLowerCase())
      )
    }

    res.status(200).json({ data: filteredData })
  }

  /**
   * Add staff member to business (matches frontend API pattern)
   */
  static async addStaff(req: Request, res: Response) {
    const { businessId } = req.params
    const { email, full_name } = req.body

    if (!email || !full_name) {
      res.status(400).json({ error: 'Email and full_name are required' })
      return
    }

    const normalizedEmail = email.toLowerCase()

    try {
      // Check if profile exists
      let { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', normalizedEmail)
        .eq('user_type', 'staff')
        .maybeSingle()

      if (!profile) {
        // Create new profile
        const { data: newProfile, error: profileError } = await supabase
          .from('profiles')
          .insert([{ email: normalizedEmail, full_name, user_type: 'staff' }])
          .select()
          .single()

        if (profileError) {
          res.status(400).json({ error: profileError.message })
          return
        }
        profile = newProfile
      }

      // Check if staff is already added to this business
      const { data: existing } = await supabase
        .from(BusinessUsersApi.table)
        .select('*')
        .eq('business_id', businessId)
        .eq('user_id', profile.id)
        .single()

      if (existing) {
        res.status(400).json({ error: 'Staff already added to this business' })
        return
      }

      // Add staff to business
      const { data: businessUser, error } = await supabase
        .from(BusinessUsersApi.table)
        .insert([{
          business_id: businessId,
          user_id: profile.id,
          role: 'staff',
        }])
        .select()
        .single()

      if (error) {
        res.status(400).json({ error: error.message })
        return
      }

      res.status(201).json({ data: { profile, businessUser } })
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' })
    }
  }
}

export default BusinessUsersApi
