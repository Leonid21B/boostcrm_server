import pkg from 'express'
import Controller from '../controllers/clients.js'
const controller = new Controller()

const { Router } = pkg

const router = Router()

router.post('/create_client', controller.create)
router.get('/clients/:userId', controller.getClients)
router.delete('/client/:id/:userId', controller.remove)
router.get('/current_client/:id', controller.getCurrent)
router.put('/update_client', controller.updateClient)
router.put('/flag_client/:id', controller.flagClient)
router.post('/check_client', controller.checkClient)
router.put('/update-client-fileds', controller.updateClientFields)
router.post('/upload-clients-from-file/:userId', controller.uploadClientsFromFile)

export default router
