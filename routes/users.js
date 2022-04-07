import pkg from 'express'
import Controller from '../controllers/users.js'
const controller = new Controller()
const { Router } = pkg
const router = Router()

router.post('/registration', controller.registration)
router.post('/login', controller.login)
router.post('/logout', controller.logout)
router.get('/activatedlink/:link', controller.activation)
router.get('/refresh', controller.refresh)

router.post('/send_invite', controller.sendInvite)
router.delete('/delete_invited_worker/:id/:selectedWorkerId', controller.deleteInvitedWorker)
router.get('/invitelink/:link', controller.invite)
router.post('/update_user', controller.updateUser)
router.post('/update_user_password', controller.updateUserPassword)
router.post('/rebuild_user_password', controller.rebuildUserPassword)
router.post('/update_user_comand', controller.updateUserComand)
router.get('/get_user_info/:userId', controller.getUserInfo)
router.get('/get_worker_info/:userId', controller.getWorkerInfo)
router.post('/upload_user_avatar/:id', controller.uploadUserAvatar)
router.delete('/delete_user_avatar/:id', controller.deleteUserAvatar)
router.post('/send_statement', controller.sendStatement)
router.put('/update_role', controller.updateRole)

export default router
