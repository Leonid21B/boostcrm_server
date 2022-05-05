import pkg from 'express'
const { Router } = pkg
import authController from '../controllers_admin/authController.js'
const router = Router()

router.post('/login',authController.login)
router.get('/check_auth',authController.checkAuth)


export default router