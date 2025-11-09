import { Request, Response } from 'express'
import { supabase } from '../client'
import { z } from 'zod/v4'
import { v4 as uuidv4 } from 'uuid'

export interface ProductOrder {
  id: string
  business_id: string | null
  customer_id: string
  total_amount: number | null
  status: string | null
  payment_status: string | null
  payment_method: string | null
  shipping_method: string | null
  shipping_address: string | null
  tracking_number: string | null
  created_at: string
  updated_at: string
}

const ProductOrderStatusSchema = z
  .enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'], {
    message: 'Invalid order status.',
  })
  .optional()
  .nullable()

const PaymentStatusSchema = z
  .enum(['pending', 'paid', 'refunded', 'failed'], {
    message: 'Invalid payment status.',
  })
  .optional()
  .nullable()

export const CreateProductOrderSchema = z.object({
  business_id: z
    .uuid({ message: 'Business ID must be a valid UUID.' })
    .nullable()
    .optional(),
  customer_id: z.uuid({ message: 'Customer ID is required and must be a valid UUID.' }),
  total_amount: z
    .number()
    .nonnegative({ message: 'Total amount must be a non-negative number.' })
    .nullable()
    .optional(),
  status: ProductOrderStatusSchema.default('pending'),
  payment_status: PaymentStatusSchema.default('pending'),
  payment_method: z.string().nullable().optional(),
  shipping_method: z.string().nullable().optional(),
  shipping_address: z.string().nullable().optional(),
  tracking_number: z.string().nullable().optional(),
})

export const UpdateProductOrderSchema = z
  .object({
    business_id: z
      .uuid({ message: 'Business ID must be a valid UUID.' })
      .nullable()
      .optional(),
    customer_id: z.uuid({ message: 'Customer ID must be a valid UUID.' }).optional(),
    total_amount: z
      .number()
      .nonnegative({ message: 'Total amount must be a non-negative number.' })
      .nullable()
      .optional(),
    status: ProductOrderStatusSchema,
    payment_status: PaymentStatusSchema,
    payment_method: z.string().nullable().optional(),
    shipping_method: z.string().nullable().optional(),
    shipping_address: z.string().nullable().optional(),
    tracking_number: z.string().nullable().optional(),
  })
  .partial()

export class ProductOrdersController {
  private static table = 'product_orders'

  static async getProductOrders(_req: Request, res: Response): Promise<void> {
    const { data, error } = await supabase.from(ProductOrdersController.table).select('*')
    if (error) {
      res.status(500).json({ error: error.message })
      return
    }
    res.status(200).json({ data })
  }

  static async getProductOrder(req: Request, res: Response): Promise<void> {
    const { id } = req.params

    const { data, error } = await supabase
      .from(ProductOrdersController.table)
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        res.status(404).json({ error: 'Order not found' })
        return
      }
      res.status(500).json({ error: error.message })
      return
    }
    res.status(200).json({ data })
  }

  static async createProductOrder(req: Request, res: Response): Promise<void> {
    const parsedBody = CreateProductOrderSchema.safeParse(req.body)

    if (!parsedBody.success) {
      res
        .status(400)
        .json({ error: parsedBody.error.issues.map(issue => issue.message).join('. ') })
      return
    }

    const id = uuidv4()
    const now = new Date().toISOString()
    const {
      business_id,
      customer_id,
      total_amount,
      status,
      payment_status,
      payment_method,
      shipping_method,
      shipping_address,
      tracking_number,
    } = parsedBody.data

    const { data: productOrder, error } = await supabase
      .from(ProductOrdersController.table)
      .insert([
        {
          id,
          business_id: business_id || null,
          customer_id,
          total_amount: total_amount || 0,
          status,
          payment_status,
          payment_method: payment_method || null,
          shipping_method: shipping_method || null,
          shipping_address: shipping_address || null,
          tracking_number: tracking_number || null,
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
    res.status(201).json({ data: productOrder })
  }

  static async updateProductOrder(req: Request, res: Response): Promise<void> {
    const { id } = req.params
    const parsedBody = UpdateProductOrderSchema.safeParse(req.body)

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

    const { data: productOrder, error } = await supabase
      .from(ProductOrdersController.table)
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        res.status(404).json({ error: 'Order not found' })
        return
      }
      res.status(400).json({ error: error.message })
      return
    }
    res.status(200).json({ data: productOrder })
  }

  static async deleteProductOrder(req: Request, res: Response): Promise<void> {
    const { id } = req.params

    const { error } = await supabase
      .from(ProductOrdersController.table)
      .delete()
      .eq('id', id)

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }
    res.sendStatus(204)
  }
}
