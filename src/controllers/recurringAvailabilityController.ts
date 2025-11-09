import { Request, Response } from 'express'
import { supabase } from '../client'
import { z } from 'zod/v4'

export interface StaffRecurringAvailability {
  id: string
  business_user_id: string
  day_of_week: number // 0 for Sunday, 6 for Saturday
  start_time: string // HH:MM:SS
  end_time: string // HH:MM:SS
  created_at: string
  updated_at: string
}

const TimeFormatSchema = z.iso.time('Wrong time format')
const DayOfWeekSchema = z
  .number()
  .int({ message: 'Day of week must be an integer.' })
  .min(0, { message: 'Day of week must be between 0 (Sunday) and 6 (Saturday).' })
  .max(6, { message: 'Day of week must be between 0 (Sunday) and 6 (Saturday).' })

export const CreateStaffRecurringAvailabilitySchema = z
  .object({
    business_user_id: z.uuid({ message: 'Business User ID must be a valid UUID.' }),
    day_of_week: DayOfWeekSchema,
    start_time: TimeFormatSchema,
    end_time: TimeFormatSchema,
  })
  .refine(
    data => {
      const dummyDate = '1970-01-01' // Use a dummy date for time-only comparison
      const startDt = new Date(`${dummyDate}T${data.start_time}Z`)
      const endDt = new Date(`${dummyDate}T${data.end_time}Z`)
      return endDt > startDt
    },
    {
      message: 'End time must be strictly greater than start time.',
      path: ['end_time', 'start_time'],
    }
  )

export const UpdateStaffRecurringAvailabilitySchema = z
  .object({
    day_of_week: DayOfWeekSchema.optional(),
    start_time: TimeFormatSchema.optional(),
    end_time: TimeFormatSchema.optional(),
  })
  .partial()
  .refine(
    data => {
      // If day_of_week is provided, and only one of start_time/end_time is provided, it's an error
      if (
        data.day_of_week !== undefined &&
        (data.start_time === undefined || data.end_time === undefined)
      ) {
        return false
      }
      return true
    },
    {
      message:
        "When updating 'day_of_week', you must supply both 'start_time' and 'end_time' so times can be re-validated.",
      path: ['day_of_week', 'start_time', 'end_time'],
    }
  )
  .refine(
    data => {
      // If both start_time and end_time are provided, validate ordering
      if (data.start_time !== undefined && data.end_time !== undefined) {
        const dummyDate = '1970-01-01'
        const startDt = new Date(`${dummyDate}T${data.start_time}Z`)
        const endDt = new Date(`${dummyDate}T${data.end_time}Z`)
        return endDt > startDt
      }
      return true
    },
    {
      message:
        'End time must be strictly greater than start time if both are provided for update.',
      path: ['end_time', 'start_time'],
    }
  )

export class StaffRecurringAvailabilityController {
  private static table = 'staff_recurring_availability'

  static async getStaffRecurringAvailability(req: Request, res: Response): Promise<void> {
    const { businessUserId } = req.params

    const { data: bu, error: buErr } = await supabase
      .from('business_users')
      .select('id')
      .eq('id', businessUserId)
      .single()
    if (buErr || !bu) {
      res.status(404).json({ error: 'Business user not found.' })
      return
    }

    const { data, error } = await supabase
      .from(StaffRecurringAvailabilityController.table)
      .select('*')
      .eq('business_user_id', businessUserId)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true })

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }
    res.status(200).json({ data })
  }

  static async createStaffRecurringAvailability(
    req: Request,
    res: Response
  ): Promise<void> {
    const { businessUserId } = req.params

    const parsedBody = CreateStaffRecurringAvailabilitySchema.safeParse({
      ...req.body,
      business_user_id: businessUserId,
    })

    if (!parsedBody.success) {
      res
        .status(400)
        .json({ error: parsedBody.error.issues.map(issue => issue.message).join('. ') })
      return
    }

    const { day_of_week, start_time, end_time } = parsedBody.data

    const { data: bu, error: buErr } = await supabase
      .from('business_users')
      .select('id')
      .eq('id', businessUserId)
      .single()
    if (buErr || !bu) {
      res.status(404).json({ error: 'Business user not found.' })
      return
    }

    const payload = {
      business_user_id: businessUserId,
      day_of_week,
      start_time,
      end_time,
    }

    const { data: recurringAvailability, error } = await supabase
      .from(StaffRecurringAvailabilityController.table)
      .insert([payload])
      .select()
      .single()

    if (error) {
      res.status(400).json({ error: error.message })
      return
    }
    res.status(201).json({ data: recurringAvailability })
  }

  static async updateStaffRecurringAvailability(
    req: Request,
    res: Response
  ): Promise<void> {
    const { id } = req.params
    const parsedBody = UpdateStaffRecurringAvailabilitySchema.safeParse(req.body)

    if (!parsedBody.success) {
      res
        .status(400)
        .json({ error: parsedBody.error.issues.map(issue => issue.message).join('. ') })
      return
    }

    const updates = parsedBody.data
    const updatePayload = {
      ...updates,
      updated_at: new Date().toISOString(),
    }

    const { data: recurringAvailability, error } = await supabase
      .from(StaffRecurringAvailabilityController.table)
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        res.status(404).json({ error: 'Recurring availability slot not found.' })
        return
      }
      res.status(400).json({ error: error.message })
      return
    }
    res.status(200).json({ data: recurringAvailability })
  }

  static async deleteStaffRecurringAvailability(
    req: Request,
    res: Response
  ): Promise<void> {
    const { id } = req.params

    const { data: existing, error: fetchErr } = await supabase
      .from(StaffRecurringAvailabilityController.table)
      .select('id')
      .eq('id', id)
      .single()
    if (fetchErr || !existing) {
      res.status(404).json({ error: 'Recurring availability slot not found.' })
      return
    }

    const { error } = await supabase
      .from(StaffRecurringAvailabilityController.table)
      .delete()
      .eq('id', id)

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }
    res.sendStatus(204)
  }
}
