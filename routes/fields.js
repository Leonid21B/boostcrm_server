import pkg from 'express'
import Controller from '../controllers/newFields.js'
const controller = new Controller()
const { Router } = pkg 

const router = Router()

router.post('/create_field', controller.create)
router.get('/fields/:cardId', controller.get)
router.put('/field_update', controller.update)

export default router
