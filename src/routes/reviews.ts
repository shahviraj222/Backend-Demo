import { Router } from 'express'
import { ReviewsController } from '../controllers/reviewsController' // Assuming the controller is in '../controllers/reviews'
import middlewares from '../middlewares' // Assuming middlewares are in '../middlewares'

const router = Router()

// Get all reviews with optional filtering and pagination
router.get('/', middlewares.checkForUser, ReviewsController.getReviews)

// Get review by ID
router.get('/:id', middlewares.checkForUser, ReviewsController.getReview)

// Create new review
router.post('/', middlewares.checkForUser, ReviewsController.createReview)

// Update review
router.put('/:id', middlewares.checkForUser, ReviewsController.updateReview)

// Delete review
router.delete('/:id', middlewares.checkForUser, ReviewsController.deleteReview)

// Get reviews by business ID
router.get(
  '/business/:businessId',
  middlewares.checkForUser,
  ReviewsController.getReviewsByBusiness
)

// Get reviews by user ID
router.get('/user/:userId', middlewares.checkForUser, ReviewsController.getReviewsByUser)

// Get reviews by rating
router.get(
  '/rating/:rating',
  middlewares.checkForUser,
  ReviewsController.getReviewsByRating
)

export default router
