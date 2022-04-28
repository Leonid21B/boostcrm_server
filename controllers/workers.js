import { workerService } from '../middleware/workers.js'

class WorkerController {
  async sendInvite (req, res, next) {
    try {
      const user = await workerService.sendInviteLink(req.body)
      return res.json(user)
    } catch (error) {
      console.log(`sendInvite`, error)
    }
  }
  async invite (req, res, next) {
    try {
      const activationlink = req.params.link
      await workerService.clicknviteLink(activationlink)
      return res.redirect(`${process.env.CLIENT_URL}/popup`)
    } catch (error) {
      console.log(`invite`, error)
    }
  }
}

export default WorkerController
