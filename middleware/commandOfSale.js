// import { addAbortSignal } from "nodemailer/lib/xoauth2";
import { ObjectId } from 'mongodb'
import { isSpaceInteger, takeSpace } from './utils.js'
import { Card } from '../models/card.js'
import { Client } from '../models/client.js'
import { CommandOfSale } from '../models/commandOfSale.js'
import { Company } from '../models/company.js'
import { newTask } from '../models/newTask.js'
import { User } from '../models/user.js'

class CommandOfSaleService {
  async create ({ title, userId, workers, img }) {
    try {
      const wrk = JSON.parse(workers)
      const user = await User.findById(userId)

      const comand = await CommandOfSale.create({ title: title, companyId: user.companyId, comandImg: img, users: wrk })
      const companySpace = await Company.findById(user.companyId, { space: 1, takenSpace: 1 })

      for (let i = 0; i < wrk.length; i++) {
        const id = wrk[i]
        const currentUser = await User.findById(id)

        Promise.all(
          [
            Card.updateMany(
              { comandId: currentUser.comandId },
              {
                $set: {
                  'comandId': comand._id
                }
              },
              { new: true }
            ),
            Client.updateMany(
              { comandId: currentUser.comandId },
              {
                $set: {
                  'comandId': comand._id
                }
              },
              { new: true }
            ),
            newTask.updateMany(
              { userId: currentUser._id },
              {
                $set: {
                  'comandId': comand._id
                }
              },
              { new: true }
            ),
            CommandOfSale.findOneAndUpdate(
              { _id: currentUser.comandId },
              {
                $pull: {
                  'users': currentUser._id
                }
              },
              { new: true }
            ),
            User.findOneAndUpdate(
              { _id: currentUser._id },
              {
                $set: {
                  'comandId': comand._id
                }
              },
              { new: true }
            ),
            CommandOfSale.findOneAndUpdate(
              { _id: comand._id },
              {
                $addToSet: {
                  'users': currentUser
                }
              },
              { new: true }
            )
          ]
        )
      }
      const companyResultSpace = await Company.findOneAndUpdate(
        { _id: user.companyId },
        {
          $addToSet: {
            'comandOfSale': comand
          },
          $set: {
            takenSpace: takeSpace(companySpace['takenSpace'], 0.001)
          }
        },
        {
          new: true
        }
      )

      const resultComands = await CommandOfSale.find({ companyId: user.companyId }).populate('users').lean()
      const updatedWorkers = await User.aggregate([
        { $match: { companyId: user.companyId, isActivated: true } },
        {
          $project: {
            _id: 1, fio: 1, email: 1, tel: 1, company: 1, comandId: 1, companyId: 1, avatar: 1, isActivated: 1, role: 1
          }
        }
      ])

      return {
        comands: resultComands,
        workers: updatedWorkers,
        space: companyResultSpace['space'],
        takenSpace: isSpaceInteger(companyResultSpace['takenSpace'])

      }
    } catch (error) {
      console.log(`CommandOfSaleService create`, error)
    }
  }

  // not use
  async getAll ({ userId }) {
    const user = await User.findById(userId)
    const comandsOfSale = await Company.findById(user.companyId)
      .populate('comandOfSale')
      .populate({ path: 'comandOfSale', populate: { path: 'cards' } })
      .populate({ path: 'comandOfSale', populate: { path: 'clients' } })
      .populate({ path: 'comandOfSale', populate: { path: 'users' } })
      .populate({ path: 'comandOfSale', populate: { path: 'users', populate: { path: 'cards' } } })
      .populate({ path: 'comandOfSale', populate: { path: 'users', populate: { path: 'clients' } } })
      .then(company => company.comandOfSale)
    return comandsOfSale
  }

  // not use
  // async getCurrent({ userId }) {
  async getOne ({ id }) {
    const comandsOfSale = await CommandOfSale.findById(id)
      .populate('cards')
      .populate('users')
      .populate('clients')
      .populate({ path: 'users', populate: { path: 'cards' } })
      .populate({ path: 'users', populate: { path: 'clients' } })
    return comandsOfSale
  }

  async update ({ comandId, title, workers, userId, img }) {
    try {
      const user = await User.findById(userId).lean()
      // const comand = await CommandOfSale.findById(comandId).lean()

      await CommandOfSale.findOneAndUpdate(
        { _id: ObjectId(comandId) },
        {
          $set: {
            'title': title,
            'comandImg': img,
            'users': []
          }
        },
        { new: true }
      )
      await User.updateMany(
        { comandId: ObjectId(comandId) },
        {
          $set: {
            'comandId': null
          }
        },
        { new: true }
      )

      for (let i = 0; i < workers.length; i++) {
        const id = workers[i]

        const currentUser = await User.findById(id)
        const updatedUser = await User.findByIdAndUpdate(
          currentUser._id,
          { comandId: comandId },
          { new: true }
        )

        Promise.all(
          [
            CommandOfSale.findOneAndUpdate(
              { _id: currentUser.comandId },
              {
                $pull: {
                  'users': currentUser._id
                }
              },
              { new: true }
            ),
            CommandOfSale.findOneAndUpdate(
              { _id: updatedUser.comandId },
              {
                $addToSet: {
                  'users': updatedUser
                }
              },
              { new: true }
            ),
            Card.updateMany({ userId: currentUser._id }, { comandId: updatedUser.comandId }, { new: true }),
            newTask.updateMany({ userId: currentUser._id }, { comandId: updatedUser.comandId }, { new: true }),
            Client.updateMany({ userId: currentUser._id }, { comandId: updatedUser.comandId }, { new: true })
          ]
        )
      }

      const updatedComands = await CommandOfSale.find({ companyId: user.companyId }).populate('users').lean()
      const updatedWorkers = await User.aggregate([
        { $match: { companyId: user.companyId } },
        {
          $project: {
            _id: 1, fio: 1, email: 1, tel: 1, avatar: 1, company: 1, comandId: 1, companyId: 1, isActivated: 1, role: 1
          }
        }
      ])

      return {
        comands: updatedComands,
        workers: updatedWorkers
      }
    } catch (error) {
      console.log(`CommandOfSale update`, error)
    }
  }

  async delete ({ id, userId, comandId }) {
    try {
      const user = await User.findById(userId)

      const removableComand = await CommandOfSale.findById(id, { _id: 1, users: 1 }).lean()
      const newComand = await CommandOfSale.findById(comandId).lean()

      if (removableComand.users.length) {
        Promise.all(
          [
            User.updateMany(
              { comandId: removableComand._id },
              {
                $set: {
                  comandId: newComand._id
                }
              },
              { new: true }
            ),
            Card.updateMany(
              { comandId: removableComand._id },
              {
                $set: {
                  comandId: newComand._id
                }
              },
              { new: true }
            ),
            newTask.updateMany(
              { comandId: removableComand._id },
              {
                $set: {
                  comandId: newComand._id
                }
              },
              { new: true }
            ),
            Client.updateMany(
              { comandId: removableComand._id },
              {
                $set: {
                  comandId: newComand._id
                }
              },
              { new: true }
            )

          ]
        )

        const users = await User.find({ comandId: newComand._id }, { _id: 1 }).lean()
        await CommandOfSale.findOneAndUpdate(
          { _id: newComand._id },
          {
            $addToSet: {
              users: users
            }
          },
          { new: true }
        )
      }

      await CommandOfSale.findByIdAndDelete(removableComand._id)
      await Company.findOneAndUpdate(
        { _id: user.companyId },
        {
          $pull: {
            comandOfSale: removableComand._id
          }
        },
        { new: true }
      )

      const comands = await CommandOfSale.find({ companyId: user.companyId })
      const workers = await User.aggregate([
        {
          $match: { companyId: user.companyId }
        },
        {
          $project: {
            _id: 1, fio: 1, email: 1, tel: 1, avatar: 1, company: 1, comandId: 1, isActivated: 1, role: 1
          }
        }
      ])
      return {
        comands: comands,
        workers: workers
      }
    } catch (error) {
      console.log(`delete`, error)
    }
  }
}

export const commandOfSaleService = new CommandOfSaleService()
