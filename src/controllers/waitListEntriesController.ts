import { Request, Response } from 'express'
import { supabase } from '../client'
import { z } from 'zod/v4'
import { v4 as uuidv4 } from 'uuid'

export interface waitListEntry {
  id: string
  service_id: string
  customer_id: string
  status: 'pending' | 'notified' | 'seated' | 'cancelled'
  notes: string | null
  created_at: string
  updated_at: string
}

const waitListEntryStatusSchema = z.enum(['pending', 'notified', 'seated', 'cancelled'], {
  message: "Status must be one of 'pending', 'notified', 'seated', 'cancelled'.",
})

export const CreatewaitListEntrySchema = z.object({
  service_id: z.uuid({ message: 'Service ID is required and must be a valid UUID.' }),
  customer_id: z.uuid({ message: 'Customer ID is required and must be a valid UUID.' }),
  status: waitListEntryStatusSchema.default('pending').optional(),
  notes: z.string().nullable().optional(),
})

export const UpdatewaitListEntrySchema = z
  .object({
    service_id: z.uuid({ message: 'Service ID must be a valid UUID.' }).optional(),
    customer_id: z.uuid({ message: 'Customer ID must be a valid UUID.' }).optional(),
    status: waitListEntryStatusSchema.optional(),
    notes: z.string().nullable().optional(),
  })
  .partial()

export class waitListEntriesController {
  private static table = 'waitlist_entries'

  static async getWaitListEntries(req: Request, res: Response): Promise<void> {
    const { service_id, customer_id } = req.query

    let query = supabase.from(waitListEntriesController.table).select('*')

    if (service_id) {
      query = query.eq('service_id', service_id as string)
    }
    if (customer_id) {
      query = query.eq('customer_id', customer_id as string)
    }

    const { data, error } = await query.order('created_at', { ascending: true })

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }
    res.status(200).json({ data })
  }

  static async getWaitListEntry(req: Request, res: Response): Promise<void> {
    const { id } = req.params

    const { data, error } = await supabase
      .from(waitListEntriesController.table)
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        res.status(404).json({ error: 'Entry not found' })
        return
      }
      res.status(500).json({ error: error.message })
      return
    }
    res.status(200).json({ data })
  }

  static async createWaitListEntry(req: Request, res: Response): Promise<void> {
    const parsedBody = CreatewaitListEntrySchema.safeParse(req.body)

    if (!parsedBody.success) {
      res
        .status(400)
        .json({ error: parsedBody.error.issues.map(issue => issue.message).join('. ') })
      return
    }

    const id = uuidv4()
    const now = new Date().toISOString()
    const { service_id, customer_id, status, notes } = parsedBody.data

    const { data: waitlistEntry, error } = await supabase
      .from(waitListEntriesController.table)
      .insert([
        {
          id,
          service_id,
          customer_id,
          status,
          notes: notes || null,
          created_at: now,
          updated_at: now,
        },
      ])
      .select()
      .single()

    if (error) {
      res.status(400).json({ error: error.message })
      return
    }
    res.status(201).json({ data: waitlistEntry })
  }

  static async updateWaitListEntry(req: Request, res: Response): Promise<void> {
    const { id } = req.params
    const parsedBody = UpdatewaitListEntrySchema.safeParse(req.body)

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

    const { data: waitlistEntry, error } = await supabase
      .from(waitListEntriesController.table)
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        res.status(404).json({ error: 'Entry not found' })
        return
      }
      res.status(400).json({ error: error.message })
      return
    }
    res.status(200).json({ data: waitlistEntry })
  }

  static async deleteWaitListEntry(req: Request, res: Response): Promise<void> {
    const { id } = req.params

    const { error } = await supabase
      .from(waitListEntriesController.table)
      .delete()
      .eq('id', id)

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }
    res.sendStatus(204)
  }
}
