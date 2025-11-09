import { Router } from 'express'
import { AuthController } from '../controllers/authController'

const router = Router()


router.post('/signup', AuthController.signUp)

router.post('/login', AuthController.login)

router.post('/logout', AuthController.logout)

router.post('/complete-profile', AuthController.completeProfile)

export default router
