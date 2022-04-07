import { clientService } from '../middleware/clients.js'

class ClientController {
  async create (req, res) {
    const user = await clientService.create(req.body)
    return res.json(user)
  }
  async flagClient (req,res){
    const user = await clientService.updateFlag(req,res)
    return res.json(user)
  }
  async getClients (req, res) {
    const { userId } = req.params
    const { limit = 10, page = 1 } = req.query
    const users = await clientService.getAll(userId, limit, page)
    return res.json(users)
  }
  async remove (req, res) {
    const users = await clientService.remove(req.params)
    return res.json(users)
  }
  async getCurrent (req, res) {
    const user = await clientService.getCurrent(req.params)
    return res.json(user)
  }
  async updateClient (req, res) {
    const clients = await clientService.update(req.body)
    return res.json(clients)
  }
  async checkClient (req, res) {
    const clients = await clientService.checkClient(req.body)
    return res.json(clients)
  }

  // TODO: check
  async updateClientFields (req, res) {
    // const clients = await clientService.updateClientFields(req.body)
  }

  async uploadClientsFromFile (req, res) {
    const file = req.files.file
    const clients = await clientService.uploadClientFromFile(file, req.params.userId)
    return res.json(clients)
  }
}

export default ClientController
