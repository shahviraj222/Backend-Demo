import { Request, Response } from 'express'
import { supabase } from '../client'

export class CustomersController {
  private static table = 'profiles'

  /**
   * Get customers (matches frontend API)
   */
  static async getCustomers(req: Request, res: Response): Promise<void> {
    try {
      const { data, error } = await supabase
        .from(CustomersController.table)
        .select('*')
        .eq('user_type', 'user')
        .order('created_at', { ascending: false })

      if (error) {
        res.status(500).json({ error: error.message })
        return
      }

      res.status(200).json({ data })
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' })
    }
  }

  /**
   * Get customer by ID
   */
  static async getCustomer(req: Request, res: Response): Promise<void> {
    const { id } = req.params

    try {
      const { data, error } = await supabase
        .from(CustomersController.table)
        .select('*')
        .eq('id', id)
        .eq('user_type', 'user')
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          res.status(404).json({ error: 'Customer not found' })
          return
        }
        res.status(500).json({ error: error.message })
        return
      }

      res.status(200).json({ data })
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' })
    }
  }
}
