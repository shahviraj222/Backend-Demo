import { Router } from 'express'
import { ServicesController } from '../controllers/servicesController' // Assuming the controller is in '../controllers/services'
import middlewares from '../middlewares' // Assuming middlewares are in '../middlewares'

const router = Router()

// Get all services (admin view with pagination and search)
router.get('/', middlewares.checkForUser, ServicesController.getAllServices)

// Get service by ID
router.get('/:id', middlewares.checkForUser, ServicesController.getService)

// Create new service
router.post('/', middlewares.checkForUser, ServicesController.createService)

// Update service
router.put('/:id', middlewares.checkForUser, ServicesController.updateService)

// Delete service (soft delete)
router.delete('/:id', middlewares.checkForUser, ServicesController.deleteService)

// Get services for a specific business
router.get(
  '/business/:businessId',
  middlewares.checkForUser,
  ServicesController.getBusinessServices
)

// Search services by type or name
router.get('/search', middlewares.checkForUser, ServicesController.searchServices)

export default router
