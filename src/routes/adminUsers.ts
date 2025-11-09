import { Router } from 'express'
import { AdminUsersController } from '../controllers/adminUsersController'
import middlewares from '../middlewares'

const router = Router()

router.get('/admin-users', AdminUsersController.getAdminUsers)
router.get('/admin-users/:id', AdminUsersController.getAdminUser)
router.post(
  '/admin-users',
  middlewares.checkForUser,
  AdminUsersController.createAdminUser
)
router.put(
  '/admin-users/:id',
  middlewares.checkForUser,
  AdminUsersController.updateAdminUser
)
router.delete(
  '/admin-users/:id',
  middlewares.checkForUser,
  AdminUsersController.deleteAdminUser
)

export default router
