import pkg from 'express'
import Controller from '../controllers/newTasks.js'
const controller = new Controller()
const { Router } = pkg

const router = Router()

router.post('/create_task', controller.createTask)
router.get('/tasks/:userId', controller.getTasks)
router.get('/current_cart_tasks/:id', controller.getCurrentCartTasks)
router.delete('/close_task/:id/:userId/:cardId', controller.close)
router.delete('/delete_task/:id/:cardId', controller.delete)
router.put('/update_task', controller.update)

export default router
