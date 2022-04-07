import pkg from 'express'
import Controller from '../controllers/main.js'
const controller = new Controller()
const { Router } = pkg
const router = Router()

router.get('/get-deals-info/:userId', controller.getDealsInfo)
router.get('/get-user-profile/:userId', controller.getUserProfile)
router.get('/get-analitics-info/:userId', controller.getAnaliticsInfo)
router.get('/get-current-analitics-info/:comandId', controller.getCurrentAnaliticsInfo)
router.get('/get-current-user-cards/:userId', controller.getCurrentUserCards)
router.get('/get-current-comand-cards/:comandId', controller.getCurrentComandCards)
router.get('/get-analitics-info-byDate/:type/:userId/:comandId/:unitMonth', controller.getAnaliticsInfoByDate)
router.get('/get-analitics-user-info-byDate/:type/:userId/:unitMonth', controller.getAnaliticsUserInfoByDate)
router.get('/get-current-card-info/:cardId', controller.getCurrentCardInfo)

router.get('/generatePay/:userId/:sum/:isAuto/:space', controller.paymentSystemGenerateRequest)

export default router
