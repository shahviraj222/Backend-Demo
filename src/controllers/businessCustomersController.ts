import { Request, Response } from 'express'
import { supabase } from '../client'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'

export interface BusinessCustomer {
  id: string
  business_id: string
  customer_id: string // This likely refers to a user's profile ID
  notes: string | null
  created_at: string
  updated_at: string
}

export const CreateBusinessCustomerSchema = z.object({
  customer_id: z.string().uuid({ message: 'Customer ID must be a valid UUID.' }),
  notes: z.string().nullable().optional(),
})

export const UpdateBusinessCustomerSchema = z
  .object({
    customer_id: z
      .uuid({ message: 'Customer ID must be a valid UUID.' })
      .optional(),
    notes: z.string().nullable().optional(),
  })
  .partial()

export class BusinessCustomersController {
  private static table = 'business_customers'

  static async getBusinessCustomers(req: Request, res: Response): Promise<void> {
    const { businessId } = req.params

    const { data, error } = await supabase
      .from(BusinessCustomersController.table)
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }
    res.status(200).json({ data })
  }

  static async getBusinessCustomer(req: Request, res: Response): Promise<void> {
    const { businessId, customerId } = req.params

    const { data, error } = await supabase
      .from(BusinessCustomersController.table)
      .select('*')
      .eq('business_id', businessId)
      .eq('customer_id', customerId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        res.status(404).json({ error: 'Customer not found for this business.' })
        return
      }
      res.status(500).json({ error: error.message })
      return
    }
    res.status(200).json({ data })
  }

  static async createBusinessCustomer(req: Request, res: Response): Promise<void> {
    const { businessId } = req.params

    const parsedBody = CreateBusinessCustomerSchema.safeParse(req.body)

    if (!parsedBody.success) {
      res
        .status(400)
        .json({ error: parsedBody.error.issues.map(issue => issue.message).join('. ') })
      return
    }

    const { customer_id, notes } = parsedBody.data

    const { data: businessCustomer, error } = await supabase
      .from(BusinessCustomersController.table)
      .insert([
        {
          id: uuidv4(),
          business_id: businessId,
          customer_id,
          notes,
        },
      ])
      .select()
      .single()

    if (error) {
      res.status(400).json({ error: error.message })
      return
    }
    res.status(201).json({ data: businessCustomer })
  }

  static async updateBusinessCustomer(req: Request, res: Response): Promise<void> {
    const { businessId, customerId } = req.params
    const parsedBody = UpdateBusinessCustomerSchema.safeParse(req.body)

    if (!parsedBody.success) {
      res
        .status(400)
        .json({ error: parsedBody.error.issues.map(issue => issue.message).join('. ') })
      return
    }

    const updates = parsedBody.data

    const { data: businessCustomer, error } = await supabase
      .from(BusinessCustomersController.table)
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('business_id', businessId)
      .eq('customer_id', customerId)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        res.status(404).json({ error: 'Customer not found for this business.' })
        return
      }
      res.status(400).json({ error: error.message })
      return
    }
    res.status(200).json({ data: businessCustomer })
  }

  static async deleteBusinessCustomer(req: Request, res: Response): Promise<void> {
    const { businessId, customerId } = req.params

    const { error } = await supabase
      .from(BusinessCustomersController.table)
      .delete()
      .eq('business_id', businessId)
      .eq('customer_id', customerId)

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }
    res.sendStatus(204)
  }
}
