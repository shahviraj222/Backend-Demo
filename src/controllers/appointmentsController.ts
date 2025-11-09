import { Request, Response } from 'express'
import { supabase } from '../client'
import { z } from 'zod'

export interface Appointment {
  id: string
  business_id: string
  service_id: string
  user_id: string | null
  staff_user_id: string | null
  business_customer_id: string | null
  start_time: string
  end_time: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' // Example statuses
  created_at: string
  updated_at: string
}

const AppointmentStatusSchema = z.enum(
  ['pending', 'confirmed', 'cancelled', 'completed'],
  {
    message: "Status must be one of 'pending', 'confirmed', 'cancelled', 'completed'.",
  }
)

export const CreateAppointmentSchema = z
  .object({
    service_id: z.uuid({ message: 'Service ID must be a valid UUID.' }),
    user_id: z.uuid({ message: 'User ID must be a valid UUID.' }).nullable().optional(),
    staff_user_id: z

      .uuid({ message: 'Staff User ID must be a valid UUID.' })
      .nullable()
      .optional(),
    business_customer_id: z

      .uuid({ message: 'Business Customer ID must be a valid UUID.' })
      .nullable()
      .optional(),
    start_time: z.iso.time({
      message: 'Start time must be a valid ISO 8601 datetime string.',
    }),
    end_time: z.iso.time({
      message: 'End time must be a valid ISO 8601 datetime string.',
    }),
    status: AppointmentStatusSchema.default('pending'),
  })
  .refine(
    data => {
      // Validate "either user_id or business_customer_id" constraint
      return data.user_id !== null || data.business_customer_id !== null
    },
    {
      message: "Either 'user_id' or 'business_customer_id' must be non-null.",
      path: ['user_id', 'business_customer_id'], // Point to both fields for clarity
    }
  )
  .refine(
    data => {
      // Validate time ordering: end_time must be strictly after start_time
      return new Date(data.end_time) > new Date(data.start_time)
    },
    {
      message: 'End time must be strictly greater than start time.',
      path: ['end_time', 'start_time'], // Point to both fields
    }
  )

export const UpdateAppointmentSchema = z
  .object({
    service_id: z
      .string()
      .uuid({ message: 'Service ID must be a valid UUID.' })
      .optional(),
    user_id: z
      .string()
      .uuid({ message: 'User ID must be a valid UUID.' })
      .nullable()
      .optional(),
    staff_user_id: z
      .string()
      .uuid({ message: 'Staff User ID must be a valid UUID.' })
      .nullable()
      .optional(),
    business_customer_id: z
      .string()
      .uuid({ message: 'Business Customer ID must be a valid UUID.' })
      .nullable()
      .optional(),
    start_time: z
      .string()
      .datetime({ message: 'Start time must be a valid ISO 8601 datetime string.' })
      .optional(),
    end_time: z
      .string()
      .datetime({ message: 'End time must be a valid ISO 8601 datetime string.' })
      .optional(),
    status: AppointmentStatusSchema.optional(),
  })
  .partial()
  .refine(
    data => {
      // Validate "either user_id or business_customer_id" constraint if both are provided for update
      if (data.user_id !== undefined && data.business_customer_id !== undefined) {
        return data.user_id !== null || data.business_customer_id !== null
      }
      return true // If one or neither is provided, this refinement doesn't apply
    },
    {
      message:
        "If updating both, either 'user_id' or 'business_customer_id' must be non-null.",
      path: ['user_id', 'business_customer_id'],
    }
  )
  .refine(
    data => {
      // Ensure end_time > start_time if either is being updated
      if (data.start_time !== undefined && data.end_time !== undefined) {
        return new Date(data.end_time) > new Date(data.start_time)
      }
      return true // If only one or neither is updated, this refinement doesn't apply
    },
    {
      message:
        'End time must be strictly greater than start time if both are provided for update.',
      path: ['end_time', 'start_time'],
    }
  )

export class AppointmentsController {
  private static table = 'appointments'

  static async getBusinessAppointments(req: Request, res: Response): Promise<void> {
    const { businessId } = req.params
    const { search } = req.query

    let query = supabase
      .from(AppointmentsController.table)
      .select(`
        id,
        start_time,
        end_time,
        status,
        created_at,
        service_id!inner (
          id,
          name,
          description,
          duration_minutes,
          price,
          currency,
          service_type
        ),
        business_id!inner (
          id,
          name,
          owner_id
        ),
        staff_user_id!inner (
          id,
          user_id!inner (
            id,
            full_name,
            email
          )
        ),
        user_id!inner (
          id,
          full_name,
          email
        )
      `)
      .eq('business_id.id', businessId)
      .order('start_time', { ascending: true })

    if (search && typeof search === 'string') {
      query = query.ilike('user_id.full_name', `%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }
    res.status(200).json({ data })
  }

  static async createAppointment(req: Request, res: Response): Promise<void> {
    const { businessId } = req.params

    const parsedBody = CreateAppointmentSchema.safeParse(req.body)

    if (!parsedBody.success) {
      res
        .status(400)
        .json({ error: parsedBody.error.issues.map(issue => issue.message).join('. ') })
      return
    }

    const {
      service_id,
      user_id,
      staff_user_id,
      business_customer_id,
      start_time,
      end_time,
      status,
    } = parsedBody.data

    // Optional: Verify that the referenced business exists
    const { data: biz, error: bizErr } = await supabase
      .from('businesses')
      .select('id')
      .eq('id', businessId)
      .single()
    if (bizErr || !biz) {
      res.status(404).json({ error: 'Business not found.' })
      return
    }

    // Optional: Verify referenced service belongs to this business
    const { data: svc, error: svcErr } = await supabase
      .from('services')
      .select('id')
      .eq('id', service_id)
      .eq('business_id', businessId)
      .single()
    if (svcErr || !svc) {
      res.status(400).json({
        error: 'Service not found or does not belong to this business.',
      })
      return
    }

    // Optional: If user_id is provided, ensure that profile exists
    if (user_id) {
      const { data: usr, error: usrErr } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user_id)
        .single()
      if (usrErr || !usr) {
        res.status(400).json({ error: 'User profile not found.' })
        return
      }
    }

    // Optional: If business_customer_id is provided, ensure that customer exists under this business
    if (business_customer_id) {
      const { data: cust, error: custErr } = await supabase
        .from('business_customers')
        .select('id')
        .eq('id', business_customer_id)
        .eq('business_id', businessId)
        .single()
      if (custErr || !cust) {
        res.status(400).json({
          error: 'Business-customer not found or does not belong to this business.',
        })
        return
      }
    }

    const payload = {
      service_id,
      user_id,
      staff_user_id,
      business_id: businessId,
      business_customer_id,
      start_time,
      end_time,
      status,
    }

    const { data: appointment, error } = await supabase
      .from(AppointmentsController.table)
      .insert([payload])
      .select()
      .single()

    if (error) {
      res.status(400).json({ error: error.message })
      return
    }
    res.status(201).json({ data: appointment })
  }

  static async updateAppointment(req: Request, res: Response): Promise<void> {
    const { id } = req.params
    const parsedBody = UpdateAppointmentSchema.safeParse(req.body)

    if (!parsedBody.success) {
      res
        .status(400)
        .json({ error: parsedBody.error.issues.map(issue => issue.message).join('. ') })
      return
    }

    const updates = parsedBody.data

    try {
      const { data: appointment, error } = await supabase
        .from(AppointmentsController.table)
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          res.status(404).json({ error: 'Appointment not found.' })
          return
        }
        res.status(400).json({ error: error.message })
        return
      }
      res.status(200).json({ data: appointment })
    } catch (err) {
      console.error('Unexpected error in PUT /v1/appointments:', err)
      res.status(500).json({ error: 'Internal server error.' })
    }
  }

  static async deleteAppointment(req: Request, res: Response): Promise<void> {
    const { id } = req.params

    const { error } = await supabase
      .from(AppointmentsController.table)
      .delete()
      .eq('id', id)

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }
    res.sendStatus(204)
  }

  static async updateAppointmentStatus(req: Request, res: Response): Promise<void> {
    const { id } = req.params
    const { action, ...payload } = req.body

    let updateData: Record<string, unknown> = {}
    
    switch (action) {
      case 'approve':
        updateData = { status: 'confirmed' }
        break
      case 'cancel':
        updateData = { status: 'cancelled' }
        break
      case 'reschedule':
        if (!payload.start_time || !payload.end_time) {
          res.status(400).json({ error: 'Missing start_time or end_time for reschedule' })
          return
        }
        updateData = {
          start_time: payload.start_time,
          end_time: payload.end_time,
          status: 'pending',
        }
        break
      default:
        res.status(400).json({ error: 'Invalid action. Must be approve, cancel, or reschedule' })
        return
    }

    const { data, error } = await supabase
      .from(AppointmentsController.table)
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        res.status(404).json({ error: 'Appointment not found' })
        return
      }
      res.status(400).json({ error: error.message })
      return
    }

    res.status(200).json({ data })
  }
}
