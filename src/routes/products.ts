import { Router } from 'express'
import { ProductsController } from '../controllers/productsController'
import middlewares from '../middlewares'

const router = Router()

router.get('/products', ProductsController.getProducts)
router.get('/products/:id', ProductsController.getProduct)
router.post('/products', middlewares.checkForUser, ProductsController.createProduct)
router.put('/products/:id', middlewares.checkForUser, ProductsController.updateProduct)
router.delete('/products/:id', middlewares.checkForUser, ProductsController.deleteProduct)

export default router
