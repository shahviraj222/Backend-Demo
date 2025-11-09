import { Router } from 'express'
import BusinessesApi from '../controllers/businessesController'
import middlewares from '../middlewares'

const router = Router()

router.get('/', middlewares.checkForUser, BusinessesApi.getUserBusinesses)
router.get('/owner/:ownerId', middlewares.checkForUser, BusinessesApi.getBusinessesByOwner)
router.get('/:id', middlewares.checkForUser, BusinessesApi.getBusiness)
router.post('/', middlewares.checkForUser, BusinessesApi.createBusiness)
router.put('/:id', middlewares.checkForUser, BusinessesApi.updateBusiness)
router.delete('/:id', middlewares.checkForUser, BusinessesApi.deleteBusiness)
router.get('/search', middlewares.checkForUser, BusinessesApi.searchBusinesses)
router.get(
  '/categories/all',
  middlewares.checkForUser,
  BusinessesApi.getBusinessCategories
)

export default router
