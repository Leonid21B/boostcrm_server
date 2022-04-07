import { successCardService } from '../middleware/successCard.js'

class SuccessCardController {
  async create (req, res) {
    const successCart = await successCardService.create(req.body)
    return res.json(successCart)
  }
  async get (req, res) {
    const successCart = await successCardService.get(req.params)
    return res.json(successCart)
  }
}

export default SuccessCardController
