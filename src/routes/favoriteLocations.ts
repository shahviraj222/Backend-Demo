import { Router } from 'express'
import FavoriteLocationsApi from '../controllers/favoriteLocationsController'
import middlewares from '../middlewares'

const router = Router()

router.get('/', middlewares.checkForUser, FavoriteLocationsApi.getFavoriteLocations)
router.get('/:id', middlewares.checkForUser, FavoriteLocationsApi.getFavoriteLocation)
router.post('/', middlewares.checkForUser, FavoriteLocationsApi.createFavoriteLocation)
router.put('/:id', middlewares.checkForUser, FavoriteLocationsApi.updateFavoriteLocation)
router.delete(
  '/:id',
  middlewares.checkForUser,
  FavoriteLocationsApi.deleteFavoriteLocation
)

router.get(
  '/user/:userId',
  middlewares.checkForUser,
  FavoriteLocationsApi.getFavoriteLocationsByUser
)
router.get(
  '/country/:country',
  middlewares.checkForUser,
  FavoriteLocationsApi.getFavoriteLocationsByCountry
)
router.get(
  '/nearby/:lat/:lng',
  middlewares.checkForUser,
  FavoriteLocationsApi.getFavoriteLocationsNear
)

export default router
