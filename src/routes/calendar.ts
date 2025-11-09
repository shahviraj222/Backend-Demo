import { Router } from 'express'
import { CalendarController } from '../controllers/calendarController'
import middlewares from '../middlewares'

const router = Router()

router.post(
  '/appointments',
  middlewares.checkForUser,
  CalendarController.createAppointment
)
router.put(
  '/appointments/:id',
  middlewares.checkForUser,
  CalendarController.updateAppointment
)
router.get(
  '/appointments',
  middlewares.checkForUser,
  CalendarController.getAppointments
)

export default router
