import { notSuccessCardService } from '../middleware/notSuccessCard.js'

class NotSuccessCardController {
  async create (req, res) {
    const successCart = await notSuccessCardService.create(req.body)
    return res.json(successCart)
  }
  async get (req, res) {
    const successCart = await notSuccessCardService.get(req.params)
    return res.json(successCart)
  }
}

export default NotSuccessCardController
