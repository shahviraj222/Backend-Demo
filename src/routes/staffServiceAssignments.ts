import { Router } from 'express'
import { StaffServiceAssignmentsController } from '../controllers/staffServiceAssignmentsController'
import middlewares from '../middlewares'

const router = Router()

router.get(
  '/business_users/:businessUserId/staff-service-assignments',
  StaffServiceAssignmentsController.getAssignmentsByBusinessUser
)
router.get(
  '/services/:serviceId/staff-service-assignments',
  StaffServiceAssignmentsController.getAssignmentsByService
)
router.post(
  '/staff-service-assignments',
  middlewares.checkForUser,
  StaffServiceAssignmentsController.createAssignment
)
router.delete(
  '/staff-service-assignments/:businessUserId/:serviceId',
  middlewares.checkForUser,
  StaffServiceAssignmentsController.deleteAssignment
)

export default router
