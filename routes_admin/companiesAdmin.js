import pkg from 'express'
import companiesController from '../controllers_admin/companiesController.js'
const { Router } = pkg
const router = Router()

router.get('/companies/:limit/:page',companiesController.getCompanies)
router.post('/companies/search',companiesController.companySearch)

export default router