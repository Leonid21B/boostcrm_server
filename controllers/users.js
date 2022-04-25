import { userService } from '../middleware/users.js'

class UserController {
  async registration (req, res, next) {
    try {
      const user = await userService.registration(req.body)
      return res.json(user)
    } catch (error) {
      console.log(`UserController registration`, error)
    }
  }

  async login (req, res, next) {
    try {
      const user = await userService.login(req.body)
      conasole.log(user)
      res.cookie('refreshToken', user.refreshToken, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true })
      return res.json(user)
    } catch (error) {

    }
  }

  async logout (req, res, next) {
    try {
      const { refreshToken } = req.cookies
      const userToken = await userService.logout(refreshToken)
      res.clearCookie('refreshToken')
      return res.json(userToken)
    } catch (error) {
      console.log(`UserController logout`, error)
    }
  }

  async refresh (req, res, next) {
    try {
      const { refreshToken } = req.cookies

      const data = await userService.refresh(refreshToken)
      if (data['status'] === 200) {
        res.cookie('refreshToken', data.refreshToken, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true })
        return res.json(data)
      }
      res.status(401)
      return res.json(data['status'])
    } catch (error) {

    }
  }

  async activation (req, res, next) {
    try {
      const activationlink = req.params.link
      await userService.activateLink(activationlink)
      return res.redirect(process.env.CLIENT_URL)
    } catch (error) {
      console.log(`activation`, error)
    }
  }
  async sendInvite (req, res, next) {
    try {
      const user = await userService.sendInviteLink(req.body)
      return res.json(user)
    } catch (error) {
      console.log(`sendInvite`, error)
    }
  }
  async deleteInvitedWorker (req, res, next) {
    try {
      const user = await userService.deleteInvitedWorker(req.params)
      return res.json(user)
    } catch (error) {
      console.log(`sendInvite`, error)
    }
  }
  async invite (req, res, next) {
    try {
      const activationlink = req.params.link
      await userService.clicknviteLink(activationlink)
      return res.redirect(process.env.CLIENT_URL)
    } catch (error) {
      console.log(`invite`, error)
    }
  }

  async getUserInfo (req, res) {
    try {
      const userInfo = await userService.getUserInfo(req.params)
      console.log(userInfo)
      return res.json(userInfo)
    } catch (error) {
      console.log(`getUserInfo`, error)
    }
  }

  async getWorkerInfo (req, res) {
    try {
      const userInfo = await userService.getWorkerInfo(req.params)
      console.log(userInfo) 
      return res.json(userInfo)
    } catch (error) {
      console.log(`getWorkerInfo`, error)
    }
  }

  async updateUser (req, res) {
    try {
      const userInfo = await userService.updateUser(req.body)
      return res.json(userInfo)
    } catch (error) {
      console.log(`getWorkerInfo`, error)
    }
  }
  async changeCurrency (req,res) {
    try {
      const userInfo = await userService.changeCurrency(req.body)
      return res.json(userInfo)
    } catch (error) {
      console.log(`changeCur`, error)
    }
  }
  async updateUserPassword (req, res) {
    try {
      const userInfo = await userService.updateUserPassword(req.body)
      return res.json(userInfo)
    } catch (error) {
      console.log(`getWorkerInfo`, error)
    }
  }
  async rebuildUserPassword (req, res) {
    try {
      const userInfo = await userService.rebuildUserPassword(req.body.email)
      return res.json(userInfo)
    } catch (error) {
      console.log(`getWorkerInfo`, error)
    }
  }
  async updateUserComand (req, res) {
    try {
      const userInfo = await userService.updateUserComand(req.body)
      return res.json(userInfo)
    } catch (error) {
      console.log(`getWorkerInfo`, error)
    }
  }

  async uploadUserAvatar (req, res) {
    try {
      const file = req.files.file
      await userService.deleteUserAvatar(req.params.id)
      const user = await userService.uploadUserAvatar(file, req.params.id)

      return res.json(user)
    } catch (error) {
      console.log(`getWorkerInfo`, error)
    }
  }

  async deleteUserAvatar (req, res) {
    try {
      const user = await userService.deleteUserAvatar(req.params.id)
      return res.json(user)
    } catch (error) {
      console.log(`getWorkerInfo`, error)
    }
  }

  async sendStatement (req, res) {
    try {
      const resp = await userService.sendStatement(req.body)
      return res.json(resp)
    } catch (error) {
      console.log(`getWorkerInfo`, error)
    }
  }

  async updateRole (req, res) {
    try {
      const resp = await userService.updateRole(req.body) 
      return res.json(resp)
    } catch (error) {
      console.log(`update role`, error)
    }
  }
  async changeRole (req, res) {
    try {
      const resp = await userService.changeRole(req.body) 
      return res.json(resp)
    } catch (error) {
      console.log(`update role`, error)
    }
  }
}

export default UserController
