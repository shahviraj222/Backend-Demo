import { Router } from 'express'
import { waitListEntriesController } from '../controllers/waitListEntriesController'
import middlewares from '../middlewares'

const router = Router()

router.get('/waitlist-entries', waitListEntriesController.getWaitListEntries)
router.get('/waitlist-entries/:id', waitListEntriesController.getWaitListEntry)
router.post(
  '/waitlist-entries',
  middlewares.checkForUser,
  waitListEntriesController.createWaitListEntry
)
router.put(
  '/waitlist-entries/:id',
  middlewares.checkForUser,
  waitListEntriesController.updateWaitListEntry
)
router.delete(
  '/waitlist-entries/:id',
  middlewares.checkForUser,
  waitListEntriesController.deleteWaitListEntry
)

export default router
