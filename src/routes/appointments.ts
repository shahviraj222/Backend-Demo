import { Router } from 'express'
import { AppointmentsController } from '../controllers/appointmentsController' // Adjust path if necessary
import middlewares from '../middlewares' // Assuming this path is correct for your middlewares

const router = Router()

router.get(
  '/businesses/:businessId/appointments',
  AppointmentsController.getBusinessAppointments
)
router.post(
  '/businesses/:businessId/appointments',
  middlewares.checkForUser,
  AppointmentsController.createAppointment
)
router.put(
  '/appointments/:id',
  middlewares.checkForUser,
  AppointmentsController.updateAppointment
)
router.delete(
  '/appointments/:id',
  middlewares.checkForUser,
  AppointmentsController.deleteAppointment
)
router.patch(
  '/appointments/:id/status',
  middlewares.checkForUser,
  AppointmentsController.updateAppointmentStatus
)

export default router
