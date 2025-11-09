import { Router } from 'express'
import { ServiceGroupsController } from '../controllers/serviceGroupController'
import middlewares from '../middlewares'

const router = Router()

// Get all service groups for a specific business
// Example: GET /v1/businesses/:businessId/service-groups (if this router is mounted at /v1)
router.get(
  '/businesses/:businessId/service-groups',
  ServiceGroupsController.getBusinessServiceGroups
)

// Get a single service group by its ID
// Example: GET /v1/service-groups/:id (if this router is mounted at /v1)
router.get('/:id', ServiceGroupsController.getServiceGroup)

// Create a new service group under a specific business
// Requires user authentication as creating data is a protected action
// Example: POST /v1/businesses/:businessId/service-groups (if this router is mounted at /v1)
router.post(
  '/businesses/:businessId/service-groups',
  middlewares.checkForUser,
  ServiceGroupsController.createServiceGroup
)

// Update a service group by its ID
// Requires user authentication as updating data is a protected action
// Example: PUT /v1/service-groups/:id (if this router is mounted at /v1)
router.put('/:id', middlewares.checkForUser, ServiceGroupsController.updateServiceGroup)

// Delete a service group by its ID
// Requires user authentication as deleting data is a protected action
// Example: DELETE /v1/service-groups/:id (if this router is mounted at /v1)
router.delete(
  '/:id',
  middlewares.checkForUser,
  ServiceGroupsController.deleteServiceGroup
)

export default router
