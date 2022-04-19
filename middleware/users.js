import { User } from '../models/user.js'
import { hash, compare } from 'bcrypt'
import { v1 } from 'uuid'
import { mailService } from './mail.js'
import { tokenService } from './tokens.js'
import UserDto from '../dto/user.js'
import { CommandOfSale } from '../models/commandOfSale.js'
import { Company } from '../models/company.js'
import { Card } from '../models/card.js'
import { Stage } from '../models/stage.js'
import { Client } from '../models/client.js'
import fs from 'fs'
import { newTask } from '../models/newTask.js'
import UserTokenDto from '../dto/userToken.js'
import { ObjectId } from 'mongodb'
import { takeSpace } from './utils.js'

class UserService {
  generatePassword (len) {
    var password = ''
    var symbols = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!№;%:?*()_+='
    for (var i = 0; i < len; i++) {
      password += symbols.charAt(Math.floor(Math.random() * symbols.length))
    }
    return password
  }

  async registration ({ fio, email, tel, gb }) {
    try {
      const hasUser = await User.findOne({ email: email })

      if (hasUser) {
        return {
          resp: {
            status: 403
          }

        }
      }

      const password = this.generatePassword(10) 
      console.log(password)
      const hashPassword = await hash(password, 5)

      const genActivationLink = v1()

      const now = new Date()
      const day = new Date(now)
      day.setDate(day.getDate() + 7)

      const company = await Company.create({ space: 1, takenSpace: 0, paymentDate: day })
      const comand = await CommandOfSale.create({ title: 'Команда продаж 1', companyId: company._id, users: [] })

      const user = await User.create(
        {
          fio: fio,
          email: email,
          tel: tel,
          password: hashPassword,
          activationlink: genActivationLink,
          companyId: company._id,
          comandId: comand._id
        }
      )

      mailService.sendLink(email, password, `${process.env.SITE_URL}/api/activatedlink/${genActivationLink}`)
      // console.log(password)
      // console.log(`${process.env.SITE_URL}/api/activatedlink/${genActivationLink}`)

      const userdto = new UserTokenDto(user)
      const tokens = await tokenService.generateToken({ ...userdto })

      tokenService.saveToken(userdto.id, tokens.refreshToken)
 
      const stage = await Stage.create(
        { title: 'Первичный контакт', userId: userdto.id, companyId: company._id }
      )

      const client = await Client.create(
        {
          name: 'Иван',
          tel: '+7 (999) 999 99 99',
          org: 'Стройматериалы',
          email: 'qwert@mail.ru',
          userId: user._id,
          companyId: user.companyId,
          comandId: comand._id
        }
      )

      const card = await Card.create(
        {
          title: 'Новая сделка',
          company: client.org,
          name: client.name,
          price: 100,
          tel: client.tel,
          email: client.email,
          address: 'Address',
          clientId: client._id,
          comandId: comand._id,
          stageId: stage._id,
          userId: userdto.id,
          companyId: company._id,
          workers: user
        }
      )

      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        {
          $addToSet: {
            cards: card,
            clients: client
          }
        },
        { new: true }
      )

      const updatedComand = await CommandOfSale.findOneAndUpdate(
        { _id: comand._id },
        {
          $addToSet: {
            users: updatedUser,
            cards: card,
            clients: client
          }
        },
        { new: true }
      )

      Promise.all(
        [
          Company.findOneAndUpdate(
            { _id: company._id },
            {
              $addToSet: {
                cards: card,
                stages: stage,
                clients: client,
                users: updatedUser,
                comandOfSale: updatedComand
              }
            },
            { new: true }
          ),
          Stage.findOneAndUpdate({ _id: stage._id }, { $addToSet: { cards: card } }, { new: true })
        ]
      )

      return {
        resp: {
          status: 200
        }
      }
    } catch (error) {
      console.log(`registration error`, error)
    }
  }

  async activateLink (link) {
    try {
      const user = await User.findOne({ activationlink: link })

      if (!user) {
        throw new Error(`This incorrect link`)
      }

      await User.findOneAndUpdate(
        { activationlink: link },
        { isActivated: true },
        { new: true }
      )
    } catch (error) {
      throw new Error('error ssaw', error)
    }
  }

  async sendInviteLink ({ email, userId }) {
    try {
      const hasUser = await User.findOne({ email: email }).lean()

      if (hasUser) {
        return {
          status: 404
        }
      }

      const inviteLink = v1()

      const password = this.generatePassword(10)
      const hashedPasswrod = await hash(password, 5)

      mailService.sendInvite(email, password, `${process.env.SITE_URL}/api/invitelink/${inviteLink}`)

      const whoInviteWorker = await User.findById(userId)
      const user = await User.create(
        {
          fio: 'YOR NAME',
          email: email,
          tel: 'YOUR PHONE',
          password: hashedPasswrod,
          activationlink: inviteLink,
          role: 'user',
          company: whoInviteWorker.company,
          companyId: whoInviteWorker.companyId,
          comandId: whoInviteWorker.comandId
        }
      )

      const userdto = new UserTokenDto(user)
      const tokens = await tokenService.generateToken({ ...userdto })

      tokenService.saveToken(userdto.id, tokens.refreshToken)

      Promise.all(
        [
          CommandOfSale.findOneAndUpdate(
            { _id: user.comandId },
            {
              $addToSet: {
                users: user
              }
            },
            { new: true }
          ),
          Company.findOneAndUpdate(
            { _id: user.companyId },
            {
              $addToSet: {
                'users': user
              }
            },
            {

              new: true
            }
          )

        ]
      )

      return {
        user: user,
        status: 200
      }
    } catch (error) {
      console.log(`sendInviteLink usesr create`, error)
    }
  }

  async deleteInvitedWorker ({ id, selectedWorkerId }) {
    try {
      const user = await User.findById(id)

      if (user.isActivated) {
        const selectedWorker = await User.findById(selectedWorkerId)

        await Card.updateMany(
          { userId: user._id },
          {
            $set: {
              userId: ObjectId(selectedWorkerId),
              comandId: selectedWorker.comandId
            },
            $push: {
              workers: selectedWorker
            }
          },
          { new: true }
        )

        await newTask.updateMany(
          { userId: user._id },
          {
            $set: {
              userId: ObjectId(selectedWorkerId),
              comandId: selectedWorker.comandId
            },
            $push: {
              workers: selectedWorker
            }
          },
          { new: true }
        )

        await Client.updateMany(
          { userId: user._id },
          {
            $set: {
              userId: ObjectId(selectedWorkerId),
              comandId: selectedWorker.comandId
            }
          },
          { new: true }
        )

        const cards = await Card.find({ userId: ObjectId(selectedWorkerId) })
        const tasks = await newTask.find({ userId: ObjectId(selectedWorkerId) })
        const clients = await Client.find({ userId: ObjectId(selectedWorkerId) })

        await User.findOneAndUpdate(
          { _id: ObjectId(selectedWorkerId) },
          {
            $addToSet: {
              cards: cards,
              tasks: tasks,
              clients: clients
            }
          },
          { new: true }
        )
        await CommandOfSale.findOneAndUpdate(
          { _id: selectedWorker.comandId },
          {
            $addToSet: {
              cards: cards,
              tasks: tasks,
              clients: clients
            }
          },
          { new: true }
        )
      }

      Promise.all(
        [
          Company.findOneAndUpdate(
            { _id: user.companyId },
            {
              $pull: {
                'users': user._id
              }
            },
            {
              new: true
            }
          ),
          CommandOfSale.findOneAndUpdate(
            { _id: user.comandId },
            {
              $pull: {
                'users': user._id
              }
            },
            {
              new: true
            }
          )
        ]
      )

      await User.findByIdAndDelete(user._id)

      const workers = await User.aggregate([
        { $match: { companyId: user.companyId } },
        {
          $project: {
            _id: 1,
            fio: 1,
            email: 1,
            tel: 1,
            company: 1,
            avatar: 1,
            comandId: 1,
            isActivated: 1,
            companyId: 1,
            role: 1
          }
        }
      ])

      return {
        userDeleted: true,
        workers: workers
      }
    } catch (error) {
      console.log(`deleteInvitedWorker`, error)
    }
  }

  async clicknviteLink (link) {
    try {
      const worker = await User.findOne({ activationlink: link })

      if (worker) {
        await User.findOneAndUpdate(
          { activationlink: link },
          { isActivated: true },
          { new: true }
        ).then(
          user => new UserDto(user)
        )
      }
    } catch (error) {
      throw new Error('error ssaw', error.message)
    }
  }

  async login ({ email, password }) {
    try {
      const user = await User.findOne({ email: email })
      if (!user) {
        return {
          resp: {
            status: 404
          }
        }
      }
      const comparePassword = await compare(password, user.password)
      if (!comparePassword) {
        return {
          resp: {
            status: 403
          }
        }
      }
      const userModel = new UserDto(user)
      const userdto = new UserTokenDto(user)

      const tokens = await tokenService.generateToken({ ...userdto })
      const companySpace = await Company.findById(user.companyId, { space: 1, takenSpace: 1 })

      await tokenService.saveToken(userdto.id, tokens.refreshToken)

      return {
        ...tokens,
        user: userModel,
        space: companySpace['space'],
        takenSpace: companySpace['takenSpace'],
        resp: {
          status: 200
        }
      }
    } catch (error) {
      console.log(`login error`, error)
    }
  }

  async logout (refreshtoken) {
    const userToken = await tokenService.remove(refreshtoken)
    return userToken
  }

  async refresh (refreshtoken) {
    try {
      if (!refreshtoken) {
        return { status: 4003 }
      }
      console.log('refreshtoken', refreshtoken)
      const userToken = tokenService.validateRefreshToken(refreshtoken)

      const hasToken = await tokenService.searchToken(refreshtoken)

      if (!userToken || !hasToken) {
        return { status: 4005 }
      }
      const user = await User.findById(userToken.id)
      const userdto = new UserDto(user)
      const tokens = await tokenService.generateToken({ ...userdto })
      await tokenService.saveToken(userdto.id, tokens.refreshToken)

      return {
        ...tokens,
        user: userdto,
        status: 200
      }
    } catch (error) {
      console.log(`refresh error`, error)
    }
  }

  async getUserInfo ({ userId }) {
    try {
      const company = await Company.findById(user.companyId)
      
      const userInfo = await User.findById(userId)
        .populate('clients')
        .populate('cards')
        .then(item => new UserDto(item))
      return userInfo
    } catch (error) {
      console.log(`getUserInfo error `, error)
    }
  }

  async getWorkerInfo ({ userId, comandId }) {
    try {
      const user = await User.findById(userId)
      const workers = await User.find({ companyId: user.companyId })
        .populate('cards')
        .populate('clients')
        .populate('tasks')

      return workers
    } catch (error) {
      console.log(`getWorkerInfo error`, error)
    }
  }

  async updateUser ({ userId, fio, email, tel, company }) {
    try {
      const user = await User.findById(userId)

      const updatedUser = await User.findByIdAndUpdate(user._id,
        { fio: fio, email: email, tel: tel, company: company },
        { new: true }
      )

      if (user.company !== company) {
        await User.updateMany({ companyId: user.companyId }, { company: company }, { new: true })
      }

      return new UserDto(updatedUser)
    } catch (error) {
      console.log(`updateUser error`, error)
    }
  }

  async updateUserPassword ({ userId, oldPassword, password }) {
    try {
      const user = await User.findById(userId)

      const comparedPasswords = await compare(oldPassword, user.password)

      if (!comparedPasswords) {
        return {
          status: 403
        }
      }

      const hashedPassword = await hash(password, 5)

      const updatedUser = await User.findOneAndUpdate(
        { _id: user._id },
        { password: hashedPassword },
        { new: true }
      )

      const userDto = new UserDto(updatedUser)

      return {
        status: 200,
        user: userDto
      }
    } catch (error) {
      console.log(`updateUserPassword`, error)
    }
  }

async rebuildUserPassword (email) {
    try {
      console.log(email)
      const user = await User.find({email:email})

      const password = this.generatePassword(10)
      console.log(password)
      const hashedPassword = await hash(password, 5)
      console.log(user)
      const updatedUser = await User.findOneAndUpdate(
        { email: email },
        { password: hashedPassword },
        { new: true }
      )
      console.log(updatedUser)
      mailService.sendLink(email,password,null)
      return {
        status: 200,
      }
    } catch (error) {
      console.log(`rebUserPassword`, error)
    }
  }

  async updateUserComand ({ userId, comandId }) {
    try {
      const user = await User.findById(userId).lean()

      const updatedUser = await User.findOneAndUpdate(
        { _id: user._id },
        { comandId: comandId },
        { new: true }
      ).then(user => new UserDto(user))

      Promise.all(
        [
          CommandOfSale.findOneAndUpdate(
            { _id: user.comandId },
            {
              $pull: {
                'users': user._id
              }
            },
            { new: true }
          ),
          CommandOfSale.findOneAndUpdate(
            { _id: updatedUser.comandId },
            {
              $addToSet: {
                'users': user
              }
            }
          ),
          Card.updateMany({ userId: user._id }, { comandId: comandId }, { new: true }),
          Client.updateMany({ userId: user._id }, { comandId: comandId }, { new: true }),
          newTask.updateMany({ userId: user._id }, { comandId: comandId }, { new: true })
        ]
      )

      const userDto = new UserDto(updatedUser)
      return userDto
    } catch (error) {
      console.log(`updateUserComand`, error)
    }
  }

  async uploadUserAvatar (file, userId) {
    try {
      const avatar = `${v1()}.jpg`
      const user = await User.findById(userId).lean()

      const fullPath = `${process.env.FILE_STATIC_PATH}/avatars`
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath)
      }

      file.mv(`${fullPath}/${avatar}`)

      const companySpace = await Company.findById(user.companyId, { space: 1, takenSpace: 1 })
      const updatedUser = await User.findOneAndUpdate(
        { _id: user._id },
        {
          $set: {
            'avatar': avatar
          }
        },
        { new: true }
      )

      const unit = file['size'] / 1024
      await Company.findOneAndUpdate(
        { _id: user.companyId },
        {
          $set: {
            takenSpace: takeSpace(companySpace['takenSpace'], unit)
          }
        },
        { new: true }
      )

      return new UserDto(updatedUser)
    } catch (error) {
      console.log(`uploadAvatarImg error`, error)
    }
  }

  async deleteUserAvatar (userId) {
    try {
      const user = await User.findById(userId).lean()
      const companySpace = await Company.findById(user.companyId, { space: 1, takenSpace: 1 })
      console.log(companySpace)
      if (user.avatar.length) {
        fs.access(`${process.env.FILE_STATIC_PATH}/avatars/${user.avatar}.jpg`, async function (err) {
          if (err) {
            await User.findOneAndUpdate(
              { _id: user._id },
              {
                $set: {
                  'avatar': ''
                }
              },
              { new: true }
            )
            const updateUser = await User.findById(user._id)
            return new UserDto(updateUser)
          }

          fs.unlinkSync(`${process.env.FILE_STATIC_PATH}/avatars/${user.avatar}`)
          console.log(12214421)
          await User.findOneAndUpdate(
            { _id: user._id },
            {
              $set: {
                'avatar': ''
              }
            },
            { new: true }
          )  
          const updateUser = await User.findById(user._id)
          return new UserDto(updateUser)
        })
      }
      let weight = 0
      if(user.avatar != '' && fs.existsSync(`${process.env.FILE_STATIC_PATH}/avatars/${user.avatar}`)){
        const stat = fs.statSync(`${process.env.FILE_STATIC_PATH}/avatars/${user.avatar}`)
        weight = stat.size / 1024
        const comp = await Company.findOneAndUpdate(
          { _id: user.companyId },
          {
            $set: {
              takenSpace: takeSpace(companySpace['takenSpace'], -1 * weight)
            }
          },
          { new: true }
        )
        fs.unlinkSync(`${process.env.FILE_STATIC_PATH}/avatars/${user.avatar}`)    
      }
      return new UserDto({ ...user, avatar: '' })
    } catch (error) {
      console.log(`deleteUserAvatar error`, error)
    }
  }

  async sendStatement ({ title, comment, typeOfMethod, userId }) {
    const user = await User.findById(userId)
    await mailService.sendStatement(
      user.email, title, comment,
      typeOfMethod === 1
        ? `Перезвонить ${user.tel}`
        : `Написать мне на почту ${user.email}`
    )
    return true
  }
  async changeCurrency ({id,currency}) {
    console.log(id,currency)
    const user = await User.findOneAndUpdate({_id:id},{currency:currency},{new:true})
    console.log(user)
    return true
  }

  async updateRole ({ userId, workerId, role }) {
    try {
      const user = await User.findById(workerId)

      await User.findOneAndUpdate(
        { _id: user._id },
        {
          $set: {
            'role': role === 1 ? 'admin' : 'user'
          }
        },
        { new: true }
      )

      const admin = await User.findById(ObjectId(userId)).then(u => new UserDto(u))
      const workers = await User.aggregate([
        { $match: { companyId: user.companyId } },
        {
          $project: {
            _id: 1, fio: 1, email: 1, tel: 1, company: 1, role: 1, avatar: 1, comandId: 1, companyId: 1, isActivated: 1
          }
        }
      ])
      return {
        user: admin,
        workers: workers
      }
    } catch (error) {
      console.log(`updateRole error`, error)
    }
  }
}

export const userService = new UserService()
