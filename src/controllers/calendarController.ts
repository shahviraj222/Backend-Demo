import { Request, Response } from 'express'
import { supabase } from '../client'
import { z } from 'zod'

const CreateAppointmentSchema = z.object({
  date: z.string().datetime({ message: 'Date must be a valid ISO datetime string.' }),
  slot: z.string().min(1, { message: 'Slot is required.' }),
  service_id: z.uuid({ message: 'Service ID must be a valid UUID.' }),
  customer_id: z.uuid({ message: 'Customer ID must be a valid UUID.' }),
  staff_id: z.uuid({ message: 'Staff ID must be a valid UUID.' }).optional(),
})

const UpdateAppointmentSchema = z.object({
  date: z.string().datetime({ message: 'Date must be a valid ISO datetime string.' }).optional(),
  slot: z.string().min(1, { message: 'Slot is required.' }).optional(),
  service_id: z.uuid({ message: 'Service ID must be a valid UUID.' }).optional(),
  customer_id: z.uuid({ message: 'Customer ID must be a valid UUID.' }).optional(),
  staff_id: z.uuid({ message: 'Staff ID must be a valid UUID.' }).optional(),
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']).optional(),
}).partial()

export class CalendarController {
  private static table = 'appointments'

  /**
   * Create appointment with business context (matches frontend API)
   */
  static async createAppointment(req: Request, res: Response): Promise<void> {
    const parsedBody = CreateAppointmentSchema.safeParse(req.body)

    if (!parsedBody.success) {
      res
        .status(400)
        .json({ error: parsedBody.error.issues.map(issue => issue.message).join('. ') })
      return
    }

    const { date, slot, service_id, customer_id, staff_id } = parsedBody.data

    try {
      // Get business from user context (assuming user is authenticated)
      const userId = req.user?.id
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' })
        return
      }

      const { data: businesses } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', userId)

      const business_id = businesses?.[0]?.id
      if (!business_id) {
        res.status(404).json({ error: 'Business not found for owner' })
        return
      }

      const { data: appointment, error } = await supabase
        .from(CalendarController.table)
        .insert([{
          date,
          slot,
          service_id,
          customer_id,
          staff_id,
          business_id,
          status: 'pending',
        }])
        .select()
        .single()

      if (error) {
        res.status(400).json({ error: error.message })
        return
      }

      res.status(201).json({ data: appointment })
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' })
    }
  }

  /**
   * Update appointment with business context (matches frontend API)
   */
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
      const userId = req.user?.id
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' })
        return
      }

      const { data: businesses } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', userId)

      const business_id = businesses?.[0]?.id
      if (!business_id) {
        res.status(404).json({ error: 'Business not found for owner' })
        return
      }

      const { data: appointment, error } = await supabase
        .from(CalendarController.table)
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('business_id', business_id)
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

      res.status(200).json({ data: appointment })
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' })
    }
  }

  /**
   * Get appointments for current user's business (matches frontend API)
   */
  static async getAppointments(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' })
        return
      }

      const { data: businesses } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', userId)

      const business_id = businesses?.[0]?.id
      if (!business_id) {
        res.status(404).json({ error: 'Business not found for owner' })
        return
      }

      const { data: appointments, error } = await supabase
        .from(CalendarController.table)
        .select(`
          id,
          created_at,
          date,
          slot,
          status,
          customer:profiles(id, full_name),
          staff:business_users(
            id,
            user:profiles(full_name)
          ),
          service:services(
            id,
            name,
            duration_minutes,
            price,
            room
          ),
          business:businesses(
            id,
            name,
            chairs,
            rooms
          )
        `)
        .eq('business_id', business_id)
        .order('created_at', { ascending: false })

      if (error) {
        res.status(500).json({ error: error.message })
        return
      }

      res.status(200).json({ data: appointments })
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' })
    }
  }
}
