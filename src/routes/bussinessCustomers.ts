import { Router } from 'express'
import { BusinessCustomersController } from '../controllers/businessCustomersController'
import middlewares from '../middlewares'

const router = Router()

router.get(
  '/businesses/:businessId/customers',
  BusinessCustomersController.getBusinessCustomers
)

router.get(
  '/businesses/:businessId/customers/:customerId',
  BusinessCustomersController.getBusinessCustomer
)

router.post(
  '/businesses/:businessId/customers',
  middlewares.checkForUser,
  BusinessCustomersController.createBusinessCustomer
)

router.put(
  '/businesses/:businessId/customers/:customerId',
  middlewares.checkForUser,
  BusinessCustomersController.updateBusinessCustomer
)

router.delete(
  '/businesses/:businessId/customers/:customerId',
  middlewares.checkForUser,
  BusinessCustomersController.deleteBusinessCustomer
)

export default router
