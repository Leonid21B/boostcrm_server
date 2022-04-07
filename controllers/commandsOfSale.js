import { commandOfSaleService } from '../middleware/commandOfSale.js'

class CommandsOfSaleController {
  async create (req, res) {
    const commandOfSale = await commandOfSaleService.create(req.body)
    return res.json(commandOfSale)
  }
  async get (req, res) {
    const commandOfSale = await commandOfSaleService.getAll(req.params)
    return res.json(commandOfSale)
  }

  async updated (req, res) {
    const resp = await commandOfSaleService.update(req.body)
    return res.json(resp)
  }
  async getCurret (req, res) {
    const commandOfSale = await commandOfSaleService.getOne(req.params)
    return res.json(commandOfSale)
  }
  async delete (req, res) {
    const commandOfSale = await commandOfSaleService.delete(req.params)
    return res.json(commandOfSale)
  }
}

export default CommandsOfSaleController
