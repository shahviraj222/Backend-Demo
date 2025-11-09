import { Router } from 'express'
import { ConversationsController } from '../controllers/conversationController'
import middlewares from '../middlewares'

const router = Router()

router.get(
  '/businesses/:businessId/conversations',
  ConversationsController.getBusinessConversations
)

router.post(
  '/businesses/:businessId/conversations',
  middlewares.checkForUser,
  ConversationsController.createConversation
)

export default router
