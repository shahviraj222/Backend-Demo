import { Request, Response } from 'express'
import { supabase } from '../client'
import { z } from 'zod/v4'

export interface StaffServiceAssignment {
  business_user_id: string
  service_id: string
  created_at: string
}

export const CreateStaffServiceAssignmentSchema = z.object({
  business_user_id: z.uuid({ message: 'Business User ID must be a valid UUID.' }),
  service_id: z.string().uuid({ message: 'Service ID must be a valid UUID.' }),
})

export class StaffServiceAssignmentsController {
  private static table = 'staff_service_assignments'

  static async getAssignmentsByBusinessUser(req: Request, res: Response): Promise<void> {
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
      .from(StaffServiceAssignmentsController.table)
      .select('business_user_id, service_id, created_at')
      .eq('business_user_id', businessUserId)
      .order('created_at', { ascending: true })

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }
    res.status(200).json({ data })
  }

  static async getAssignmentsByService(req: Request, res: Response): Promise<void> {
    const { serviceId } = req.params

    const { data: svc, error: svcErr } = await supabase
      .from('services')
      .select('id')
      .eq('id', serviceId)
      .single()
    if (svcErr || !svc) {
      res.status(404).json({ error: 'Service not found.' })
      return
    }

    const { data, error } = await supabase
      .from(StaffServiceAssignmentsController.table)
      .select('business_user_id, service_id, created_at')
      .eq('service_id', serviceId)
      .order('created_at', { ascending: true })

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }
    res.status(200).json({ data })
  }

  static async createAssignment(req: Request, res: Response): Promise<void> {
    const parsedBody = CreateStaffServiceAssignmentSchema.safeParse(req.body)

    if (!parsedBody.success) {
      res
        .status(400)
        .json({ error: parsedBody.error.issues.map(issue => issue.message).join('. ') })
      return
    }

    const { business_user_id, service_id } = parsedBody.data

    const { data: bu, error: buErr } = await supabase
      .from('business_users')
      .select('id, business_id')
      .eq('id', business_user_id)
      .single()
    if (buErr || !bu) {
      res.status(404).json({ error: 'Business user not found.' })
      return
    }

    const { data: svc, error: svcErr } = await supabase
      .from('services')
      .select('id, business_id')
      .eq('id', service_id)
      .single()
    if (svcErr || !svc) {
      res.status(404).json({ error: 'Service not found.' })
      return
    }
    if (svc.business_id !== bu.business_id) {
      res.status(400).json({
        error: 'Service does not belong to the same business as the staff user.',
      })
      return
    }

    const payload = { business_user_id, service_id }
    const { data: assignment, error } = await supabase
      .from(StaffServiceAssignmentsController.table)
      .insert([payload])
      .select()
      .single()

    if (error) {
      res.status(400).json({ error: error.message })
      return
    }
    res.status(201).json({ data: assignment })
  }

  static async deleteAssignment(req: Request, res: Response): Promise<void> {
    const { businessUserId, serviceId } = req.params

    const { data: existing, error: exErr } = await supabase
      .from(StaffServiceAssignmentsController.table)
      .select('business_user_id')
      .eq('business_user_id', businessUserId)
      .eq('service_id', serviceId)
      .single()
    if (exErr || !existing) {
      res.status(404).json({ error: 'Assignment not found.' })
      return
    }

    const { error } = await supabase
      .from(StaffServiceAssignmentsController.table)
      .delete()
      .eq('business_user_id', businessUserId)
      .eq('service_id', serviceId)

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }
    res.sendStatus(204)
  }
}
