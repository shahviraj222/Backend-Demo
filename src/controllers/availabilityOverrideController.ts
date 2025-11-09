import { Request, Response } from 'express'
import { supabase } from '../client'
import { z } from 'zod'

export interface AvailabilityOverride {
  id: string
  business_user_id: string
  override_date: string // YYYY-MM-DD
  start_time: string // HH:MM:SS
  end_time: string // HH:MM:SS
  is_available: boolean
  reason: string | null
  created_at: string
  updated_at: string
}

const TimeFormatSchema = z.iso.time('Wrong time format')
const DateFormatSchema = z.iso.date('Date is not formatted properly')

export const CreateAvailabilityOverrideSchema = z
  .object({
    business_user_id: z
      .uuid({ message: 'Business User ID must be a valid UUID.' }),
    override_date: DateFormatSchema,
    start_time: TimeFormatSchema,
    end_time: TimeFormatSchema,
    is_available: z.boolean({ message: 'is_available must be a boolean.' }),
    reason: z.string().nullable().optional(),
  })
  .refine(
    data => {
      const startDt = new Date(`${data.override_date}T${data.start_time}Z`)
      const endDt = new Date(`${data.override_date}T${data.end_time}Z`)
      return endDt > startDt
    },
    {
      message: 'End time must be strictly greater than start time.',
      path: ['end_time', 'start_time'],
    }
  )

export const UpdateAvailabilityOverrideSchema = z
  .object({
    override_date: DateFormatSchema.optional(),
    start_time: TimeFormatSchema.optional(),
    end_time: TimeFormatSchema.optional(),
    is_available: z.boolean({ message: 'is_available must be a boolean.' }).optional(),
    reason: z.string().nullable().optional(),
  })
  .partial()
  .refine(
    data => {
      // If override_date is provided, ensure both start_time and end_time are also provided
      if (
        data.override_date !== undefined &&
        (data.start_time === undefined || data.end_time === undefined)
      ) {
        return false
      }
      return true
    },
    {
      message:
        "When updating 'override_date', you must supply both 'start_time' and 'end_time' for re-validation.",
      path: ['override_date', 'start_time', 'end_time'],
    }
  )
  .refine(
    data => {
      // If all three (override_date, start_time, end_time) are present, validate time ordering
      if (
        data.override_date !== undefined &&
        data.start_time !== undefined &&
        data.end_time !== undefined
      ) {
        const startDt = new Date(`${data.override_date}T${data.start_time}Z`)
        const endDt = new Date(`${data.override_date}T${data.end_time}Z`)
        return endDt > startDt
      }
      // If not all three are present, this specific validation doesn't apply
      return true
    },
    {
      message:
        'End time must be strictly greater than start time if date and times are provided.',
      path: ['end_time', 'start_time'],
    }
  )

export class AvailabilityOverridesController {
  private static table = 'availability_overrides'

  static async getBusinessAvailabilityOverrides(
    req: Request,
    res: Response
  ): Promise<void> {
    const { businessId } = req.params

    const { data, error } = await supabase
      .from(AvailabilityOverridesController.table)
      .select('*')
      .eq('business_user_id', businessId)
      .order('override_date', { ascending: false })
      .order('start_time', { ascending: true })

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }
    res.status(200).json({ data })
  }

  static async createAvailabilityOverride(req: Request, res: Response): Promise<void> {
    const { businessUserId } = req.params

    const parsedBody = CreateAvailabilityOverrideSchema.safeParse({
      ...req.body,
      business_user_id: businessUserId,
    })

    if (!parsedBody.success) {
      res
        .status(400)
        .json({ error: parsedBody.error.issues.map(issue => issue.message).join('. ') })
      return
    }

    const { override_date, start_time, end_time, is_available, reason } = parsedBody.data

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
      override_date,
      start_time,
      end_time,
      is_available,
      reason,
    }

    const { data: availabilityOverride, error } = await supabase
      .from(AvailabilityOverridesController.table)
      .insert([payload])
      .select()
      .single()

    if (error) {
      res.status(400).json({ error: error.message })
      return
    }
    res.status(201).json({ data: availabilityOverride })
  }

  static async updateAvailabilityOverride(req: Request, res: Response): Promise<void> {
    const { id } = req.params
    const parsedBody = UpdateAvailabilityOverrideSchema.safeParse(req.body)

    if (!parsedBody.success) {
      res
        .status(400)
        .json({ error: parsedBody.error.issues.map(issue => issue.message).join('. ') })
      return
    }

    const updates = parsedBody.data

    const { data: availabilityOverride, error } = await supabase
      .from(AvailabilityOverridesController.table)
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        res.status(404).json({ error: 'Availability override not found.' })
        return
      }
      res.status(400).json({ error: error.message })
      return
    }
    res.status(200).json({ data: availabilityOverride })
  }

  static async deleteAvailabilityOverride(req: Request, res: Response): Promise<void> {
    const { id } = req.params

    const { data: existing, error: fetchErr } = await supabase
      .from(AvailabilityOverridesController.table)
      .select('id')
      .eq('id', id)
      .single()
    if (fetchErr || !existing) {
      res.status(404).json({ error: 'Availability override not found.' })
      return
    }

    const { error } = await supabase
      .from(AvailabilityOverridesController.table)
      .delete()
      .eq('id', id)

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }
    res.sendStatus(204)
  }
}
