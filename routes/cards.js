import pkg from 'express'
import Controller from '../controllers/cards.js'
const controller = new Controller()

const { Router } = pkg

const router = Router() 

router.post('/create_cart', controller.createCart)
router.get('/carts/:userId', controller.getCarts)
router.get('/cart/:id', controller.getCart)
router.get('/card_history/:id', controller.getCardHistory)
router.post('/create_comment', controller.createCardComment)
router.put('/cart_update', controller.updateCart)
router.delete('/cart/:id/:userId', controller.deleteCart)

router.put('/cart_update_stage', controller.updateCartStage)
router.put('/cart_update_worker', controller.updateCartWorker)
router.put('/cart_update_status', controller.updateCardStatus)
router.put('/cart_update_title', controller.updateCardTitle)

router.post('/cart_upload_file/:cardId/:userId', controller.uploadFile)

export default router
