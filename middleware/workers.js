import { CommandOfSale } from '../models/commandOfSale.js'
import { User } from '../models/user.js'
import { mailService } from './mail.js'
import { hash } from 'bcrypt'
import { v1 } from 'uuid'

class WorkerService { 
  async sendInviteLink ({ email, userId }) {
    try {
      const inviteLink = v1()
 
      const password = this.generatePassword(10)
      console.log(password)
      const hashedPasswrod = await hash(password, 5)

      await mailService.sendInvite(email, password, `${process.env.SITE_URL}/api/invitelink/${inviteLink}`)

      const comandOfSale = await CommandOfSale.findOne({ userId: userId })
      const invitedWorker = await User.create(
        {
          fio: 'NONE',
          email: email,
          tel: 'NONE',
          password: hashedPasswrod,
          activationlink: inviteLink,
          isActivated: false,
          role: 'user',
          comandOfSale: comandOfSale._id
        }
      )

      return invitedWorker
    } catch (error) {
      console.log(`sendInviteLink usesr create`, error)
    }
  }
  async clicknviteLink (link) {
    try {
      const worker = await User.findOne({ activationlink: link })
      if (worker) {
        await User.findOneAndUpdate({ activationlink: link }, { isActivated: true }, { new: true })
      }
    } catch (error) {
      throw new Error('error ssaw', error.message)
    }
  }
}

export const workerService = new WorkerService()
