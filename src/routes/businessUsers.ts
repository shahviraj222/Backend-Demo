import { Router } from 'express'
import BusinessUsersApi from '../controllers/businessUsersController'
import middlewares from '../middlewares'

const router = Router()

router.get('/', middlewares.checkForUser, BusinessUsersApi.getBusinessUsers)
router.get('/:id', middlewares.checkForUser, BusinessUsersApi.getBusinessUser)
router.post('/', middlewares.checkForUser, BusinessUsersApi.createBusinessUser)
router.put('/:id', middlewares.checkForUser, BusinessUsersApi.updateBusinessUser)
router.delete('/:id', middlewares.checkForUser, BusinessUsersApi.deleteBusinessUser)
router.get(
  '/business/:businessId',
  middlewares.checkForUser,
  BusinessUsersApi.getBusinessUsersByBusiness
)
router.get(
  '/user/:userId',
  middlewares.checkForUser,
  BusinessUsersApi.getBusinessUsersByUser
)
router.get(
  '/role/:role',
  middlewares.checkForUser,
  BusinessUsersApi.getBusinessUsersByRole
)
router.get(
  '/businesses/:businessId/staff',
  middlewares.checkForUser,
  BusinessUsersApi.getBusinessStaff
)
router.post(
  '/businesses/:businessId/staff',
  middlewares.checkForUser,
  BusinessUsersApi.addStaff
)

export default router
