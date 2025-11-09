import { Request, Response } from 'express'
import { supabase } from '../client'
import { z } from 'zod'

export interface Conversation {
  id: string
  business_id: string
  user_id: string
  last_message_at: string | null
  created_at: string
  updated_at: string
}

export const CreateConversationSchema = z.object({
  user_id: z.uuid({ message: 'User ID must be a valid UUID.' }),
  last_message_at: z.iso
    .time({ message: 'Last message time must be a valid ISO 8601 datetime string.' })
    .nullable()
    .optional(),
})

export class ConversationsController {
  private static table = 'conversations'

  static async getBusinessConversations(req: Request, res: Response): Promise<void> {
    const { businessId } = req.params

    const { data, error } = await supabase
      .from(ConversationsController.table)
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }
    res.status(200).json({ data })
  }

  static async createConversation(req: Request, res: Response): Promise<void> {
    const { businessId } = req.params

    const parsedBody = CreateConversationSchema.safeParse(req.body)

    if (!parsedBody.success) {
      res
        .status(400)
        .json({ error: parsedBody.error.issues.map(issue => issue.message).join('. ') })
      return
    }

    const { user_id, last_message_at } = parsedBody.data

    const { data: conversation, error } = await supabase
      .from(ConversationsController.table)
      .insert([
        {
          business_id: businessId,
          user_id,
          last_message_at: last_message_at || null,
        },
      ])
      .select()
      .single()

    if (error) {
      res.status(400).json({ error: error.message })
      return
    }
    res.status(201).json({ data: conversation })
  }
}
