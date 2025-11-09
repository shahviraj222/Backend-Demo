import { Request, Response } from 'express'
import { supabase } from '../client'
import { z } from 'zod/v4'

export interface ServiceGroup {
  id: string
  business_id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export const CreateServiceGroupSchema = z.object({
  business_id: z.uuid({ message: 'Business ID must be a valid UUID.' }),
  name: z
    .string()
    .min(1, { message: 'Name is required.' })
    .max(255, { message: 'Name cannot exceed 255 characters.' }),
  description: z.string().nullable().optional(),
})

export const UpdateServiceGroupSchema = z
  .object({
    business_id: z.string('Business ID must be a valid UUID.').optional(),
    name: z
      .string()
      .min(1, { message: 'Name is required.' })
      .max(255, { message: 'Name cannot exceed 255 characters.' })
      .optional(),
    description: z.string().nullable().optional(),
  })
  .partial()

export class ServiceGroupsController {
  private static table = 'service_groups'

  static async getBusinessServiceGroups(req: Request, res: Response): Promise<void> {
    const { businessId } = req.params

    const { data, error } = await supabase
      .from(ServiceGroupsController.table)
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }

    res.status(200).json({ data })
  }

  static async getServiceGroup(req: Request, res: Response): Promise<void> {
    const { id } = req.params

    const { data, error } = await supabase
      .from(ServiceGroupsController.table)
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        res.status(404).json({ error: 'Service group not found' })
        return
      }
      res.status(500).json({ error: error.message })
      return
    }

    res.status(200).json({ data })
  }

  static async createServiceGroup(req: Request, res: Response): Promise<void> {
    const { businessId } = req.params

    const parsedBody = CreateServiceGroupSchema.safeParse({
      ...req.body,
      business_id: businessId,
    })

    if (!parsedBody.success) {
      res
        .status(400)
        .json({ error: parsedBody.error.issues.map(issue => issue.message).join('. ') })
      return
    }

    const { name, description } = parsedBody.data

    const { data: serviceGroup, error } = await supabase
      .from(ServiceGroupsController.table)
      .insert([
        {
          business_id: businessId,
          name,
          description: description || null,
        },
      ])
      .select()
      .single()

    if (error) {
      res.status(400).json({ error: error.message })
      return
    }

    res.status(201).json({ data: serviceGroup })
  }

  static async updateServiceGroup(req: Request, res: Response): Promise<void> {
    const { id } = req.params

    const parsedBody = UpdateServiceGroupSchema.safeParse(req.body)

    if (!parsedBody.success) {
      res
        .status(400)
        .json({ error: parsedBody.error.issues.map(issue => issue.message).join('. ') })
      return
    }

    const updateData = parsedBody.data

    const { data: serviceGroup, error } = await supabase
      .from(ServiceGroupsController.table)
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        res.status(404).json({ error: 'Service group not found' })
        return
      }
      res.status(400).json({ error: error.message })
      return
    }

    res.status(200).json({ data: serviceGroup })
  }

  static async deleteServiceGroup(req: Request, res: Response): Promise<void> {
    const { id } = req.params

    const { error } = await supabase
      .from(ServiceGroupsController.table)
      .delete()
      .eq('id', id)

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }

    res.sendStatus(204)
  }
}
