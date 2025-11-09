import { Router } from 'express'
import { AvailabilityOverridesController } from '../controllers/availabilityOverrideController' // Adjust path if necessary
import middlewares from '../middlewares' // Assuming this path is correct for your middlewares

const router = Router()

router.get(
  '/businesses/:businessId/availability-overrides',
  AvailabilityOverridesController.getBusinessAvailabilityOverrides
)

router.post(
  '/business_users/:businessUserId/availability-overrides',
  middlewares.checkForUser,
  AvailabilityOverridesController.createAvailabilityOverride
)

router.put(
  '/availability-overrides/:id',
  middlewares.checkForUser,
  AvailabilityOverridesController.updateAvailabilityOverride
)

router.delete(
  '/availability-overrides/:id',
  middlewares.checkForUser,
  AvailabilityOverridesController.deleteAvailabilityOverride
)

export default router
