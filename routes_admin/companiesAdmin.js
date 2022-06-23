import pkg from 'express'
import companiesController from '../controllers_admin/companiesController.js'
const { Router } = pkg
const router = Router()

router.get('/companies/:limit/:page',companiesController.getCompanies)
router.post('/companies/search',companiesController.companySearch)
router.post('/company/change_company_admin/:userId',companiesController.changeAdmin)
router.delete('/company/delete_user/:userId',companiesController.deleteUser)
router.get('/company/get_current_company/:id',companiesController.getCompany)
router.put('/company/change_payment_date',companiesController.changePayDate)
router.put('/company/change_space',companiesController.changeSpace)
router.get('/companies/get_all_data',companiesController.getAll)
router.delete('/companies/delete_current_company/:companyId',companiesController.deleteCurrent)

export default router