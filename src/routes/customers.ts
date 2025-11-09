import { Router } from 'express'
import { CustomersController } from '../controllers/customersController'
import middlewares from '../middlewares'

const router = Router()

router.get(
  '/',
  middlewares.checkForUser,
  CustomersController.getCustomers
)
router.get(
  '/:id',
  middlewares.checkForUser,
  CustomersController.getCustomer
)

export default router
