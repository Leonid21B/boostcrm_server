import pkg from 'express'
import Controller from '../controllers/commandsOfSale.js'
const controller = new Controller()
const { Router } = pkg
const router = Router()

router.post('/create_comand', controller.create)
router.get('/get_comand_of_sale/:userId', controller.get)
router.get('/get_current_comand_of_sale/:id', controller.getCurret)
router.put('/update_comand_of_sale', controller.updated)
router.delete('/delete_comand_of_sale/:id/:userId/:comandId', controller.delete)

export default router
