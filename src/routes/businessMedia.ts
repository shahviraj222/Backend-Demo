import { Router } from 'express'
import { businessMediaApi } from '../controllers/businessMediaController'
import middlewares from '../middlewares'

const router = Router()

router.get('/', middlewares.checkForUser, businessMediaApi.getBusinessMedia)
router.get('/:id', middlewares.checkForUser, businessMediaApi.getBusinessMediaItem)
router.post('/', middlewares.checkForUser, businessMediaApi.createBusinessMedia)
router.put('/:id', middlewares.checkForUser, businessMediaApi.updateBusinessMedia)
router.delete('/:id', middlewares.checkForUser, businessMediaApi.deleteBusinessMedia)
router.get(
  '/business/:businessId',
  middlewares.checkForUser,
  businessMediaApi.getBusinessMediaByBusiness
)
router.get(
  '/type/:mediaType',
  middlewares.checkForUser,
  businessMediaApi.getBusinessMediaByType
)

export default router
