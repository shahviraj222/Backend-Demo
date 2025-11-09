import { Router } from 'express'
import { ProductOrderItemsController } from '../controllers/productOrderItemsController'
import middlewares from '../middlewares'

const router = Router()

router.get(
  '/product-orders/:orderId/items',
  ProductOrderItemsController.getProductsOrderItems
)

router.get('/product-order-items/:id', ProductOrderItemsController.getProductOrderItem)

router.post(
  '/product-order-items',
  middlewares.checkForUser,
  ProductOrderItemsController.createProductOrderItem
)

router.put(
  '/product-order-items/:id',
  middlewares.checkForUser,
  ProductOrderItemsController.updateProductOrderItem
)

router.delete(
  '/product-order-items/:id',
  middlewares.checkForUser,
  ProductOrderItemsController.deleteProductOrderItem
)

export default router
