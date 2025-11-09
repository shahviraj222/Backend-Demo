import { Router } from 'express'
import { StaffRecurringAvailabilityController } from '../controllers/recurringAvailabilityController'
import middlewares from '../middlewares'

const router = Router()

router.get(
  '/business_users/:businessUserId/staff-recurring-availability',
  StaffRecurringAvailabilityController.getStaffRecurringAvailability
)

router.post(
  '/business_users/:businessUserId/staff-recurring-availability',
  middlewares.checkForUser,
  StaffRecurringAvailabilityController.createStaffRecurringAvailability
)

router.put(
  '/staff-recurring-availability/:id',
  middlewares.checkForUser,
  StaffRecurringAvailabilityController.updateStaffRecurringAvailability
)

router.delete(
  '/staff-recurring-availability/:id',
  middlewares.checkForUser,
  StaffRecurringAvailabilityController.deleteStaffRecurringAvailability
)

export default router
