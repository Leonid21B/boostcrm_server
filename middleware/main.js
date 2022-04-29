import UserDto from '../dto/user.js'
import { Card } from '../models/card.js'
import { CommandOfSale } from '../models/commandOfSale.js'
import { Company } from '../models/company.js'
import { newTask } from '../models/newTask.js'
import { User } from '../models/user.js'
import { Stage } from '../models/stage.js'
import { Client } from '../models/client.js'
import { Field } from '../models/newField.js'
import { formatToISOFromat, removeDateSeconds, isSpaceInteger } from './utils.js'
import { ObjectId } from 'mongodb'
import axios from 'axios'
// import fetch from 'node-fetch'
import { v4 } from 'uuid'
// import request from 'req'

class MainService {
  async getDealsInfo ({ userId }) {
    const user = await User.findById(userId)

    if (!user) {
      return { status: 401 }
    }

    const cards = await (await Card.find({ companyId: user.companyId })
      .populate('workers')
      .populate('tasks')
      .limit(50)
    )
      .filter(card => card.status === 'active')
      .sort((a, b) => a.createdAt < b.createdAt)

    const comands = await CommandOfSale.aggregate([
      { $match: { companyId: user.companyId } }
    ])

    const workers = await (await User.find({ companyId: user.companyId })
      .populate('cards')
      .populate('clients')
      .populate('tasks')
    ).filter(w => w.isActivated)

    const stages = await Stage.find({ companyId: user.companyId })

    const tasks = await newTask.find({ companyId: user.companyId }).populate('workers')

    const activeTasks = tasks.filter(t => t.status === 'active')
    const delay = tasks
      .filter(t => removeDateSeconds(t.date) < removeDateSeconds(new Date()))
      .filter(t => t.status === 'active')

    const userData = new UserDto(user)
    const companySpace = await Company.findById(user.companyId, { space: 1, takenSpace: 1, paymentDate: 1 })

    return {
      userData: userData,
      cards: cards,
      comands: comands,
      workers: workers,
      stages: stages,
      tasks: activeTasks,
      delay: delay,
      space: companySpace['space'],
      takenSpace: isSpaceInteger(companySpace['takenSpace']),
      paymentDate: companySpace['paymentDate'],
      status: 200
    }
  }

  async getUserProfile ({ userId }) {
    const user = await User.findById(userId, {
      _id: 1,
      fio: 1,
      role: 1,
      tel: 1,
      email: 1,
      isActivated: 1,
      company: 1,
      avatar: 1,
      companyId: 1,
      cards: 1,
      tasks: 1,
      clients: 1,
      successes: 1,
      refusals: 1,
      comments: 1,
      comandId: 1,
      currency: 1,
    }).lean()

    const comands = await CommandOfSale.find({ companyId: user.companyId }).populate('users').lean()

    // const workes = await Company.findById(user.companyId).populate('users').then(company => company.users)
    const workes = await User.find({ companyId: user.companyId }).lean()

    return {
      userData: new UserDto(user),
      comands: comands,
      workers: workes
    }
  }

  async getAnaliticsInfo ({ userId }) {
    const user = await User.findById(userId)
    if (user.role === 'admin') {
      const clients = await Client.find({ companyId: user.companyId }, { _id: 1 }).lean().count()

      const companyCards = await Card.find({ companyId: user.companyId })
        .populate('tasks')
        .populate('workers')

      const cards = companyCards.filter(c => c.status === 'active')
      const success = companyCards.filter(s => s.status === 'success')
      const refusual = companyCards.filter(r => r.status === 'refusual')

      const comands = await CommandOfSale.find({ companyId: user.companyId })

      const workers = await (await User.find({ companyId: user.companyId })
        .populate('cards')
        .populate('tasks')
        .populate('clients')
      ).filter(w => w.isActivated)

      const resultWorkers = [...workers].map(
        user => {
          return {
            _id: user._id,
            fio: user.fio,
            avatar: user.avatar,
            comandId: user.comandId,
            companyId: user.companyId,
            cards: user.cards.filter(c => c.status === 'active'),
            clients: user.clients,
            success: user.cards.filter(c => c.status === 'success'),
            refusual: user.cards.filter(c => c.status === 'refusual'),
            comments: user.comments,
            tasks: user.tasks.filter(t => t.status === 'active')
          }
        }
      )
      // const stages = await Stage.find({ companyId: user.companyId }).populate('cards')
      const stages = await Stage.aggregate(
        [
          { $match: { companyId: user.companyId } },
          {
            $lookup: {
              from: 'cards',
              localField: 'cards',
              foreignField: '_id',
              as: 'cards'
            }
          },
          {
            $project: {
              _id: 1,
              title: 1,
              companyId: 1,
              stageImg: 1,
              cards: {
                $filter: {
                  input: '$cards',
                  as: 'card',
                  cond: { $eq: ['$$card.status', 'active'] }
                }
              }
            }
          }
        ]
      )

      return {
        userInfo: new UserDto(user),
        clients: clients,
        cards: cards,
        success: success,
        refusual: refusual,
        allComands: comands,
        workers: resultWorkers,
        stages: stages
        // resultWorkers
      }
    }

    const worker = await User.findById(userId)
      .populate('clients')
      .populate('cards')
      .then(user => new UserDto(user))

    const stages = await Stage.find({ companyId: user.companyId }).populate('cards')
    const comand = await CommandOfSale.findById(user.comandId).lean()

    const cards = await Card.find({ userId: user._id }).populate('tasks').lean()
    const clients = await Client.find({ userId: user._id }).lean().count()

    const activeCards = cards.filter(c => c.status === 'active')
    const successCards = cards.filter(c => c.status === 'success')
    const refusualCards = cards.filter(c => c.status === 'refusual')

    return {
      worker,
      stages,
      comand,
      clients,
      cards: activeCards,
      successCards,
      refusualCards
    }
  }

  async getCurrentAnaliticsInfo ({ comandId }) {
    const comandClietns = await Client.find({ comandId: comandId }, { _id: 1 }).count()
    const comandCards = await Card.find({ comandId: comandId })

    const activeCards = comandCards.filter(card => card.status === 'active')
    const comandSuccess = comandCards.filter(card => card.status === 'success')
    const comandRefusual = comandCards.filter(card => card.status === 'refusual')

    return {
      clients: comandClietns,
      cards: activeCards.length,
      success: comandSuccess,
      refusual: comandRefusual
    }
  }

  async getCurrentUserCards ({ userId }) {
    const user = await User.findById(userId, { _id: 1, fio: 1, companyId: 1 }).lean()

    const cards = await Card.find({ userId: user._id }).populate('tasks').populate('workers')
    const tasks = await newTask.find({ userId: user._id }).populate('workers')

    const activeCards = cards.filter(c => c.status === 'active')
    const noTasksCards = activeCards.filter(c => !c.tasks.length)
    const activeTasks = tasks.filter(t => t.status === 'active')
    const overdueCards = activeTasks.filter(t => removeDateSeconds(t.date) < removeDateSeconds(new Date()))

    const companySpace = await Company.findById(user.companyId, { space: 1, takenSpace: 1 })

    return {
      cards: activeCards,
      tasks: activeTasks,
      noTasks: noTasksCards,
      overdueCards: overdueCards,
      space: companySpace['space'],
      takenSpace: isSpaceInteger(companySpace['takenSpace'])
    }
  }

  async getCurrentComandCards ({ comandId }) {
    const comand = await CommandOfSale.findById(comandId, { _id: 1, companyId: 1 }).lean()

    const cards = await Card.find({ comandId: comand._id }).populate('tasks').populate('workers')
    const tasks = await newTask.find({ comandId: comand._id }).populate('workers')

    const activeCards = cards.filter(c => c.status === 'active')
    const noTasksCards = activeCards.filter(c => !c.tasks.length)
    const activeTasks = tasks.filter(t => t.status === 'active')
    const overdueCards = activeTasks.filter(t => removeDateSeconds(t.date) < removeDateSeconds(new Date()))

    const companySpace = await Company.findById(comand.companyId, { space: 1, takenSpace: 1 })

    return {
      cards: activeCards,
      tasks: activeTasks,
      noTasks: noTasksCards,
      overdueCards: overdueCards,
      space: companySpace['space'],
      takenSpace: isSpaceInteger(companySpace['takenSpace'])
    }
  }

  async sortAnaliticsByDate (type, field, idForField, data, user) {
    console.log({
      ...data
    })
    const clients = await Client.find({
      [field]: idForField,
      createdAt:
                { $gte: data['from'], $lt: data['to'] }
    }, { _id: 1 }).sort({ createdAt: 1 }).lean()

    const cards = await Card.find({
      [field]: idForField,
      createdAt:
                { $gte: data['from'], $lt: data['to'] }
    }, { _id: 1, status: 1, updatedAt: 1 }).populate('workers').lean()

    const success = cards
      .filter(c => new Date(c.updatedAt) >= new Date(data['from']) &&
                new Date(c.updatedAt) <= new Date(data['to'])
      ).filter(c => c.status === 'success')

    const refusual = cards
      .filter(c => new Date(c.updatedAt) >= new Date(data['from']) &&
                new Date(c.updatedAt) <= new Date(data['to'])
      ).filter(c => c.status === 'refusual')

    const u = await User.find({ companyId: user.companyId })
      .populate('cards')
      .populate('tasks')
      .populate('clients')

    const result = [...u].map(
      user => {
        return {
          _id: user._id,
          fio: user.fio,
          comandId: user.comandId,
          companyId: user.companyId,
          avatar: user.avatar,
          comments: user.comments
            .filter(
              com => new Date(com.createdAt) >= new Date(data['from']) &&
                                new Date(com.createdAt) <= new Date(data['to'])
            ),

          cards: user.cards
            .filter(c => c.status === 'active')
            .filter(
              c => new Date(c.createdAt) >= new Date(data['from']) &&
                                new Date(c.createdAt) <= new Date(data['to'])
            ),

          clients: user.clients.filter(
            cl => new Date(cl.createdAt) >= new Date(data['from']) &&
                            new Date(cl.createdAt) <= new Date(data['to'])
          ),
          tasks: user.tasks
            .filter(t => t.status === 'active')
            .filter(
              t => new Date(t.createdAt) >= new Date(data['from']) &&
                                new Date(t.createdAt) <= new Date(data['to'])
            ),
          success: user.cards
            .filter(c => c.status === 'success')
            .filter(
              c => new Date(c.updatedAt) >= new Date(data['from']) &&
                                new Date(c.updatedAt) <= new Date(data['to'])
            ),
          refusual: user.cards
            .filter(c => c.status === 'refusual')
            .filter(
              c => new Date(c.updatedAt) >= new Date(data['from']) &&
                                new Date(c.updatedAt) <= new Date(data['to'])
            )
        }
      }
    )

    return {
      clients: clients.length,
      cards: cards.filter(c => c.status === 'active').length,
      success: success,
      refusual: refusual,
      workers: result
    }
  }

  async getAnaliticsInfoByDate ({ type, userId, comandId, unitMonth }) {
    const user = await User.findById(userId)
    const comand = await CommandOfSale.findById(comandId)

    const isComand = comand ? { field: 'comandId', id: comand._id } : { field: 'companyId', id: user.companyId }

    if (type === 'TODAY') {
      const today = new Date().setSeconds(0, 0)

      const clients = await Client.find({
        [isComand['field']]: isComand['id'],
        createdAt:
                    { $gte: formatToISOFromat(today) }
      }, { _id: 1 }).lean()

      const cards = await Card.find({
        [isComand['field']]: isComand['id'],
        createdAt:
                    { $gte: formatToISOFromat(today) }
      }).lean()

      const success = await (await Card.find({
        [isComand['field']]: isComand['id'],
        updatedAt:
                    { $gte: formatToISOFromat(today) }
      }).populate('workers')).filter(card => card.status === 'success')

      const refusual = await (await Card.find({
        [isComand['field']]: isComand['id'],
        updatedAt:
                    { $gte: formatToISOFromat(today) }
      }).populate('workers')).filter(card => card.status === 'refusual')

      const u = await User.find({ companyId: user.companyId })
        .populate('cards')
        .populate('tasks')
        .populate('clients')

      const result = [...u].map(
        user => {
          return {
            _id: user._id,
            fio: user.fio,
            comandId: user.comandId,
            companyId: user.companyId,
            avatar: user.avatar,
            comments: user.comments
              .filter(com => formatToISOFromat(com.createdAt, 2) >= formatToISOFromat(new Date(), 2)),

            cards: user.cards
              .filter(c => c.status === 'active')
              .filter(c => formatToISOFromat(c.createdAt, 2) >= formatToISOFromat(new Date(), 2)),

            clients: user.clients.filter(
              cl => formatToISOFromat(cl.createdAt, 2) >= formatToISOFromat(new Date(), 2)
            ),
            tasks: user.tasks
              .filter(t => t.status === 'active')
              .filter(
                t => formatToISOFromat(t.createdAt, 2) >= formatToISOFromat(new Date(), 2)
              ),
            success: user.cards
              .filter(c => c.status === 'success')
              .filter(c => formatToISOFromat(c.updatedAt, 2) >= formatToISOFromat(new Date(), 2)),

            refusual: user.cards
              .filter(c => c.status === 'refusual')
              .filter(c => formatToISOFromat(c.updatedAt, 2) >= formatToISOFromat(new Date(), 2))
          }
        }
      )

      return {
        clients: clients.length,
        cards: cards.filter(c => c.status === 'active').length,
        success: success,
        refusual: refusual,
        workers: result
      }
    }
    if (type === 'YESTERDAY') {
      const now = new Date()
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      const result = await this.sortAnaliticsByDate(0, isComand['field'], isComand['id'],
        { from: formatToISOFromat(yesterday), to: formatToISOFromat(now) }, user)

      return {
        // clients: result['clients'],
        // cards: result['cards'],
        // success: result['success'],
        // refusual: result['refusual']
        ...result
      }
    }
    if (type === 'WEEK') {
      const now = new Date()
      const day = now.getDay()
      // TODO: Оптимизировать
      const d1 = day !== 0 ? day - 1 : day + 6

      const weekStart = new Date(now)
      console.log(`weekStart`, weekStart.getDate())
      weekStart.setDate(weekStart.getDate() - d1)

      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 7)

      const result = await this.sortAnaliticsByDate(0, isComand['field'], isComand['id'],
        { from: formatToISOFromat(weekStart), to: formatToISOFromat(weekEnd) }, user)

      return {
        // clients: result['clients'],
        // cards: result['cards'],
        // success: result['success'],
        // refusual: result['refusual']
        ...result
      }
    }
    if (type === 'MONTH') {
      const now = new Date()
      const monthStart = new Date(now)
      monthStart.setMonth(unitMonth)
      console.log(`monthStart`, monthStart)
      monthStart.setDate(monthStart.getDate() - monthStart.getDate() + 1)

      const monthEnd = new Date(monthStart)
      monthEnd.setDate(monthEnd.getMonth() === 1 ? monthEnd.getDate() + 27 : monthEnd.getDate() + 30)

      const result = await this.sortAnaliticsByDate(0, isComand['field'], isComand['id'],
        { from: formatToISOFromat(monthStart), to: formatToISOFromat(monthEnd) }, user)

      return {
        // clients: result['clients'],
        // cards: result['cards'],
        // success: result['success'],
        // refusual: result['refusual']
        ...result
      }
    }
  }

  async getAnaliticsUserInfoByDate ({ type, userId, unitMonth }) {
    try {
      const user = await User.findById(userId)

      if (type === 'TODAY') {
        const clients = await Client.find({
          userId: user._id,
          createdAt:
                        { $gte: formatToISOFromat(new Date()) }
        })

        const cards = await Card.find({
          userId: user._id,
          createdAt:
                        { $gte: formatToISOFromat(new Date()) }
        })

        const success = await (await Card.find({
          userId: user._id,
          updatedAt:
                        { $gte: formatToISOFromat(new Date()) }
        }).populate('workers')
        ).filter(card => card.status === 'success')

        const refusual = await (await Card.find({
          userId: user._id,
          updatedAt:
                        { $gte: formatToISOFromat(new Date()) }
        }).populate('workers')).filter(card => card.status === 'refusual')

        return {
          clients: clients.length,
          cards: cards.length,
          success: success,
          refusual: refusual
        }
      }
      if (type === 'YESTERDAY') {
        const now = new Date()
        const yesterday = new Date(now)
        yesterday.setDate(yesterday.getDate() - 1)

        const result = await this.sortAnaliticsByDate(0, 'userId', user._id,
          { from: formatToISOFromat(yesterday), to: formatToISOFromat(now) })

        return {
          clients: result['clients'],
          cards: result['cards'],
          success: result['success'],
          refusual: result['refusual']
        }
      }
      if (type === 'WEEK') {
        const now = new Date()
        const day = now.getDay()
        // TODO: Оптимизировть
        const d1 = day !== 0 ? day - 1 : day + 6

        const weekStart = new Date(now)
        weekStart.setDate(weekStart.getDate() - d1)

        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekEnd.getDate() + 7)

        const result = await this.sortAnaliticsByDate(0, 'userId', user._id,
          { from: formatToISOFromat(weekStart), to: formatToISOFromat(weekEnd) })

        return {
          clients: result['clients'],
          cards: result['cards'],
          success: result['success'],
          refusual: result['refusual']
        }
      }
      if (type === 'MONTH') {
        const now = new Date()
        const monthStart = new Date(now)
        monthStart.setMonth(unitMonth)
        monthStart.setDate(monthStart.getDate() - monthStart.getDate() + 1)

        const monthEnd = new Date(monthStart)
        monthEnd.setDate(monthEnd.getMonth() === 1 ? monthEnd.getDate() + 27 : monthEnd.getDate() + 30)

        const result = await this.sortAnaliticsByDate(0, 'userId', user._id,
          { from: formatToISOFromat(monthStart), to: formatToISOFromat(monthEnd) })

        return {
          clients: result['clients'],
          cards: result['cards'],
          success: result['success'],
          refusual: result['refusual']
        }
      }
    } catch (error) {
      console.log(`getAnaliticsUserInfoByDate `, error)
    }
  }

  // not use
  async getCurrentCardInfo ({ cardId }) {
    try {
      const card = await Card.findById(cardId)
      const history = await Card.findById(card._id).then(card => card.history)
      const tasks = await newTask.find({ cardId: card._id })
      const fileds = await Field.find({ cardId: card._id })

      return {
        card: card,
        history: history,
        tasks: tasks,
        fileds: fileds
      }
    } catch (error) {
      console.log(`getCurrentCardInfo error`, error)
    }
  }

  async paymentSystemGenerateRequest (userId, sum, isAuto = false, space = 1) {
    try {
      const user = await User.findById(userId)

      const data = await axios.post('https://api.yookassa.ru/v3/payments',
        {
          'amount': {
            'value': `${sum}`,
            'currency': 'RUB'
          },
          'capture': true,
          'confirmation': {
            'type': 'redirect',
            'return_url': 'https://boostcrm.ru'
          },
          'description': `${user._id}|${user.fio}`
          // 'save_payment_method': isAuto
        },
        {
          headers: {
            'Idempotence-Key': v4(),
            'Content-Type': 'application/json'
          },

          auth: {
            username: '871444',
            password: 'live_oMayhMBMZVjmTUJe8tWTFqs8jqaHB3nXwGBzIRLbZoA'
          },
          method: 'POST'
        }
      ).then(d => d.data)

      await User.findOneAndUpdate(
        { _id: ObjectId(userId) },
        { requestedSpace: space },
        { new: true } 
      )

      console.log('first', data)
      return data
    } catch (error) {
      console.log(`paymentSystemGenerateRequest error`, error)
    }
  }
}

export const mainService = new MainService()
