import { mainService } from '../middleware/main.js'

class MainController {
  async getDealsInfo (req, res) {
    const data = await mainService.getDealsInfo(req.params)
    if (data['status'] !== 200) {
      res.status(401)
      return res.json(data['status'])
    }
    return res.json(data)
  }

  async getUserProfile (req, res) {
    const data = await mainService.getUserProfile(req.params)
    console.log(data)
    return res.json(data)
  }

  async getAnaliticsInfo (req, res) {
    const data = await mainService.getAnaliticsInfo(req.params)
    return res.json(data)
  }

  async getCurrentAnaliticsInfo (req, res) {
    const data = await mainService.getCurrentAnaliticsInfo(req.params)
    return res.json(data)
  }

  async getCurrentUserCards (req, res) {
    const data = await mainService.getCurrentUserCards(req.params)
    return res.json(data)
  }

  async getCurrentComandCards (req, res) {
    const data = await mainService.getCurrentComandCards(req.params)
    return res.json(data)
  }

  async getAnaliticsInfoByDate (req, res) {
    const data = await mainService.getAnaliticsInfoByDate(req.params)
    return res.json(data)
  }

  async getAnaliticsUserInfoByDate (req, res) {
    const data = await mainService.getAnaliticsUserInfoByDate(req.params)
    return res.json(data)
  }

  async getCurrentCardInfo (req, res) {
    const data = await mainService.getCurrentCardInfo(req.params)
    return res.json(data)
  }

  async paymentSystemGenerateRequest (req, res) {
    const {userId, sum, isAuto, space} = req.params
    const data = await mainService.paymentSystemGenerateRequest(userId, sum, isAuto, space)
    return res.json(data.confirmation.confirmation_url)
  }
}

export default MainController
