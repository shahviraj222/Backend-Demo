import { Request, Response } from 'express'
import { supabase } from '../client'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'

export interface AdminUser {
  id: string
  user_id: string
  email: string
  created_by: string | null
  created_at: string
  updated_at: string
}

export const CreateAdminUserSchema = z.object({
  user_id: z.uuid({ message: 'User ID must be a valid UUID.' }),
  email: z.email({ message: 'Invalid email address.' }),
  created_by: z
    .uuid({ message: 'Created by ID must be a valid UUID.' })
    .nullable()
    .optional(),
})

export const UpdateAdminUserSchema = z
  .object({
    user_id: z.uuid({ message: 'User ID must be a valid UUID.' }).optional(),
    email: z.email({ message: 'Invalid email address.' }).optional(),
    created_by: z
      .uuid({ message: 'Created by ID must be a valid UUID.' })
      .nullable()
      .optional(),
  })
  .partial()

export class AdminUsersController {
  private static table = 'admin_users'

  static async getAdminUsers(_req: Request, res: Response): Promise<void> {
    const { data, error } = await supabase.from(AdminUsersController.table).select('*')
    if (error) {
      res.status(500).json({ error: error.message })
      return
    }
    res.status(200).json({ data })
  }

  static async getAdminUser(req: Request, res: Response): Promise<void> {
    const { id } = req.params

    const { data, error } = await supabase
      .from(AdminUsersController.table)
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        res.status(404).json({ error: 'Admin user not found' })
        return
      }
      res.status(500).json({ error: error.message })
      return
    }
    res.status(200).json({ data })
  }

  static async createAdminUser(req: Request, res: Response): Promise<void> {
    const parsedBody = CreateAdminUserSchema.safeParse(req.body)

    if (!parsedBody.success) {
      res
        .status(400)
        .json({ error: parsedBody.error.issues.map(issue => issue.message).join('. ') })
      return
    }

    const id = uuidv4()
    const { user_id, email, created_by } = parsedBody.data

    const { data: adminUser, error } = await supabase
      .from(AdminUsersController.table)
      .insert([{ id, user_id, email, created_by }])
      .select()
      .single()

    if (error) {
      res.status(400).json({ error: error.message })
      return
    }
    res.status(201).json({ data: adminUser })
  }

  static async updateAdminUser(req: Request, res: Response): Promise<void> {
    const { id } = req.params
    const parsedBody = UpdateAdminUserSchema.safeParse(req.body)

    if (!parsedBody.success) {
      res
        .status(400)
        .json({ error: parsedBody.error.issues.map(issue => issue.message).join('. ') })
      return
    }

    const updateData = parsedBody.data

    const { data: adminUser, error } = await supabase
      .from(AdminUsersController.table)
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        res.status(404).json({ error: 'Admin user not found' })
        return
      }
      res.status(400).json({ error: error.message })
      return
    }
    res.status(200).json({ data: adminUser })
  }

  static async deleteAdminUser(req: Request, res: Response): Promise<void> {
    const { id } = req.params

    const { error } = await supabase
      .from(AdminUsersController.table)
      .delete()
      .eq('id', id)

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }
    res.sendStatus(204)
  }
}
