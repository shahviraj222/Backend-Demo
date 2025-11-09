import { Router } from 'express'
import { ProductOrdersController } from '../controllers/productOrdersController'
import middlewares from '../middlewares'

const router = Router()

router.get('/product-orders', ProductOrdersController.getProductOrders)
router.get('/product-orders/:id', ProductOrdersController.getProductOrder)
router.post(
  '/product-orders',
  middlewares.checkForUser,
  ProductOrdersController.createProductOrder
)
router.put(
  '/product-orders/:id',
  middlewares.checkForUser,
  ProductOrdersController.updateProductOrder
)
router.delete(
  '/product-orders/:id',
  middlewares.checkForUser,
  ProductOrdersController.deleteProductOrder
)

export default router
