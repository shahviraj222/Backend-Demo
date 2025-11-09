import { Router } from 'express'
import FavoritesApi from '../controllers/favoritesController' // Assuming the controller is in '../controllers/favorites'
import middlewares from '../middlewares' // Assuming middlewares are in '../middlewares'

const router = Router()

// Get all favorites with optional filtering and pagination
router.get('/', middlewares.checkForUser, FavoritesApi.getFavorites)

// Get favorite by ID
router.get('/:id', middlewares.checkForUser, FavoritesApi.getFavorite)

// Create new favorite
router.post('/', middlewares.checkForUser, FavoritesApi.createFavorite)

// Delete favorite
router.delete('/:id', middlewares.checkForUser, FavoritesApi.deleteFavorite)

// Get favorites by user ID
router.get('/user/:userId', middlewares.checkForUser, FavoritesApi.getFavoritesByUser)

// Get favorites by business ID
router.get(
  '/business/:businessId',
  middlewares.checkForUser,
  FavoritesApi.getFavoritesByBusiness
)

// Check if business is favorited by user
router.get(
  '/isFavorited/:userId/:businessId',
  middlewares.checkForUser,
  FavoritesApi.isFavorited
)

// Toggle favorite status
router.post(
  '/toggleFavorite/:userId/:businessId',
  middlewares.checkForUser,
  FavoritesApi.toggleFavorite
)

// Get current user's favorites
router.get('/me', middlewares.checkForUser, FavoritesApi.getUserFavorites)

// Check if current user has favorited a business
router.get(
  '/me/isFavorited/:businessId',
  middlewares.checkForUser,
  FavoritesApi.checkUserFavorite
)

// Toggle favorite status for current user
router.post(
  '/me/toggleFavorite/:businessId',
  middlewares.checkForUser,
  FavoritesApi.toggleUserFavorite
)

export default router
