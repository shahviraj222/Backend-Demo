import { Request, Response } from 'express'
import { supabase } from '../client'
import { z } from 'zod/v4'
import { v4 as uuidv4 } from 'uuid'

export interface Product {
  id: string
  business_id: string
  name: string
  description: string | null
  price: number
  currency: string
  discount_price: number | null
  category: string | null
  brand: string | null
  sku: string | null
  stock_quantity: number | null
  tags: string[] | null // Assuming tags could be an array of strings
  image_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export const CreateProductSchema = z.object({
  business_id: z.uuid({ message: 'Business ID must be a valid UUID.' }),
  name: z
    .string()
    .min(1, { message: 'Name is required.' })
    .max(255, { message: 'Name cannot exceed 255 characters.' }),
  description: z.string().nullable().optional(),
  price: z.number().nonnegative({ message: 'Price must be a non-negative number.' }),
  currency: z
    .string()
    .min(1, { message: 'Currency is required.' })
    .max(3, { message: 'Currency must be a 3-letter code (e.g., USD).' }),
  discount_price: z
    .number()
    .nonnegative({ message: 'Discount price must be a non-negative number.' })
    .nullable()
    .optional(),
  category: z.string().nullable().optional(),
  brand: z.string().nullable().optional(),
  sku: z.string().nullable().optional(),
  stock_quantity: z
    .number()
    .int()
    .nonnegative({ message: 'Stock quantity must be a non-negative integer.' })
    .nullable()
    .optional(),
  tags: z.array(z.string()).nullable().optional(),
  image_url: z
    .url({ message: 'Image URL must be a valid URL.' })
    .nullable()
    .optional(),
  is_active: z
    .boolean({ message: 'is_active must be a boolean.' })
    .default(true)
    .optional(),
})

export const UpdateProductSchema = z
  .object({
    business_id: z
      .uuid({ message: 'Business ID must be a valid UUID.' })
      .optional(),
    name: z
      .string()
      .min(1, { message: 'Name is required.' })
      .max(255, { message: 'Name cannot exceed 255 characters.' })
      .optional(),
    description: z.string().nullable().optional(),
    price: z
      .number()
      .nonnegative({ message: 'Price must be a non-negative number.' })
      .optional(),
    currency: z
      .string()
      .min(1, { message: 'Currency is required.' })
      .max(3, { message: 'Currency must be a 3-letter code (e.g., USD).' })
      .optional(),
    discount_price: z
      .number()
      .nonnegative({ message: 'Discount price must be a non-negative number.' })
      .nullable()
      .optional(),
    category: z.string().nullable().optional(),
    brand: z.string().nullable().optional(),
    sku: z.string().nullable().optional(),
    stock_quantity: z
      .number()
      .int()
      .nonnegative({ message: 'Stock quantity must be a non-negative integer.' })
      .nullable()
      .optional(),
    tags: z.array(z.string()).nullable().optional(),
    image_url: z
      .url({ message: 'Image URL must be a valid URL.' })
      .nullable()
      .optional(),
    is_active: z.boolean({ message: 'is_active must be a boolean.' }).optional(),
  })
  .partial()

export class ProductsController {
  private static table = 'products'

  static async getProducts(_req: Request, res: Response): Promise<void> {
    const { data, error } = await supabase
      .from(ProductsController.table)
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }
    res.status(200).json({ data })
  }

  static async getProduct(req: Request, res: Response): Promise<void> {
    const { id } = req.params

    const { data, error } = await supabase
      .from(ProductsController.table)
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        res.status(404).json({ error: 'Product not found.' })
        return
      }
      res.status(500).json({ error: error.message })
      return
    }
    res.status(200).json({ data })
  }

  static async createProduct(req: Request, res: Response): Promise<void> {
    const parsedBody = CreateProductSchema.safeParse(req.body)

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
      name,
      description,
      price,
      currency,
      discount_price,
      category,
      brand,
      sku,
      stock_quantity,
      tags,
      image_url,
      is_active,
    } = parsedBody.data

    const { data: product, error } = await supabase
      .from(ProductsController.table)
      .insert([
        {
          id,
          business_id,
          name,
          description: description || null,
          price,
          currency,
          discount_price: discount_price || null,
          category: category || null,
          brand: brand || null,
          sku: sku || null,
          stock_quantity: stock_quantity || null,
          tags: tags || null,
          image_url: image_url || null,
          is_active: is_active ?? true,
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
    res.status(201).json({ data: product })
  }

  static async updateProduct(req: Request, res: Response): Promise<void> {
    const { id } = req.params
    const parsedBody = UpdateProductSchema.safeParse(req.body)

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

    const { data: product, error } = await supabase
      .from(ProductsController.table)
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        res.status(404).json({ error: 'Product not found.' })
        return
      }
      res.status(400).json({ error: error.message })
      return
    }
    res.status(200).json({ data: product })
  }

  static async deleteProduct(req: Request, res: Response): Promise<void> {
    const { id } = req.params

    const { error } = await supabase.from(ProductsController.table).delete().eq('id', id)

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }
    res.sendStatus(204)
  }
}
