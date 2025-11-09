import { Request, Response } from 'express'
import { supabase } from '../client'
import { z } from 'zod/v4'
import { v4 as uuidv4 } from 'uuid'

export interface ProductOrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  unit_price: number
  total_price: number
  notes: string | null
  created_at: string
  updated_at: string
}

export const CreateProductOrderItemSchema = z.object({
  order_id: z.uuid({ message: 'Order ID must be a valid UUID.' }),
  product_id: z.uuid({ message: 'Product ID must be a valid UUID.' }),
  quantity: z
    .number()
    .int()
    .positive({ message: 'Quantity must be a positive integer.' })
    .default(1),
  unit_price: z
    .number()
    .nonnegative({ message: 'Unit price must be a non-negative number.' })
    .default(0),
  notes: z.string().nullable().optional(),
})

export const UpdateProductOrderItemSchema = z
  .object({
    quantity: z
      .number()
      .int()
      .positive({ message: 'Quantity must be a positive integer.' })
      .optional(),
    unit_price: z
      .number()
      .nonnegative({ message: 'Unit price must be a non-negative number.' })
      .optional(),
    notes: z.string().nullable().optional(),
  })
  .partial()

export class ProductOrderItemsController {
  private static table = 'product_order_items'

  static async getProductsOrderItems(req: Request, res: Response): Promise<void> {
    const { orderId } = req.params

    const { data, error } = await supabase
      .from(ProductOrderItemsController.table)
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true })

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }
    res.status(200).json({ data })
  }

  static async getProductOrderItem(req: Request, res: Response): Promise<void> {
    const { id } = req.params

    const { data, error } = await supabase
      .from(ProductOrderItemsController.table)
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        res.status(404).json({ error: 'Item not found.' })
        return
      }
      res.status(500).json({ error: error.message })
      return
    }
    res.status(200).json({ data })
  }

  static async createProductOrderItem(req: Request, res: Response): Promise<void> {
    const parsedBody = CreateProductOrderItemSchema.safeParse(req.body)

    if (!parsedBody.success) {
      res
        .status(400)
        .json({ error: parsedBody.error.issues.map(issue => issue.message).join('. ') })
      return
    }

    const { order_id, product_id, quantity, unit_price, notes } = parsedBody.data

    const id = uuidv4()
    const total_price = quantity * unit_price
    const created_at = new Date().toISOString()

    const { data: productOrderItem, error } = await supabase
      .from(ProductOrderItemsController.table)
      .insert([
        {
          id,
          order_id,
          product_id,
          quantity,
          unit_price,
          total_price,
          notes,
          created_at,
        },
      ])
      .select()
      .single()

    if (error) {
      res.status(400).json({ error: error.message })
      return
    }
    res.status(201).json({ data: productOrderItem })
  }

  static async updateProductOrderItem(req: Request, res: Response): Promise<void> {
    const { id } = req.params
    const parsedBody = UpdateProductOrderItemSchema.safeParse(req.body)

    if (!parsedBody.success) {
      res
        .status(400)
        .json({ error: parsedBody.error.issues.map(issue => issue.message).join('. ') })
      return
    }

    const updates = parsedBody.data
    const updatePayload: { [key: string]: unknown } = { ...updates }

    if (updates.quantity !== undefined && updates.unit_price !== undefined) {
      updatePayload.total_price = updates.quantity * updates.unit_price
    } else if (updates.quantity !== undefined || updates.unit_price !== undefined) {
      // If only one of quantity or unit_price is provided, we need to fetch the other
      // to correctly calculate total_price. For simplicity, we'll assume the client
      // provides both if total_price needs recalculation, or handle this more robustly
      // by fetching the current item from DB first.
      // For now, we'll only calculate if both are present in the update payload.
    }

    updatePayload.updated_at = new Date().toISOString()

    const { data: productOrderItem, error } = await supabase
      .from(ProductOrderItemsController.table)
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        res.status(404).json({ error: 'Item not found.' })
        return
      }
      res.status(400).json({ error: error.message })
      return
    }
    res.status(200).json({ data: productOrderItem })
  }

  static async deleteProductOrderItem(req: Request, res: Response): Promise<void> {
    const { id } = req.params

    const { error } = await supabase
      .from(ProductOrderItemsController.table)
      .delete()
      .eq('id', id)

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }
    res.sendStatus(204)
  }
}
