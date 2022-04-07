import pkg from 'express'
import Controller from '../controllers/stages.js'
const controller = new Controller()
const { Router } = pkg

const router = Router()

router.post('/create_stage', controller.createStage)
router.get('/stages/:userId', controller.getStages)
router.put('/update-stage', controller.updateStage)
router.delete('/stage/:id/:userId/:transferto', controller.deleteStage)

export default router
