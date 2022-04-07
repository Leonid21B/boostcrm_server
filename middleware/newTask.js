import HistoryDto from '../dto/history.js'
import { Card } from '../models/card.js'
import { Company } from '../models/company.js'
import { newTask } from '../models/newTask.js'
import { User } from '../models/user.js'

import { v1 } from 'uuid'
import { takeSpace } from './utils.js'

class NewTaskService {
  async createTask ({ title, description, date, time, id, userId, workers }) {
    try {
      const user = await User.findById(userId, { _id: 1, fio: 1, avatar: 1, companyId: 1, comandId: 1 }).lean()
      const card = await Card.findById(id).lean()

      const task = await newTask.create(
        {
          title,
          description,
          date: date,
          time,
          cardId: id,
          userId: user._id,
          comandId: user.comandId,
          clientId: card.clientId,
          companyId: user.companyId
        }
      )

      for (let i = 0; i < workers.length; i++) {
        const item = workers[i]
        const responsible = await User.findById(item, { fio: 1, avatar: 1 }).lean()

        await newTask.findOneAndUpdate(
          { _id: task._id },
          {
            $addToSet: {
              'workers': responsible
            }
          }
        )

        await User.findOneAndUpdate({ _id: item }, { $addToSet: { 'tasks': task } }, { new: true })
      }

      const companySpace = await Company.findById(user.companyId, { takenSpace: 1 }).lean()

      await Company.findOneAndUpdate(
        { _id: user.companyId },
        {
          $set: {
            takenSpace: takeSpace(companySpace['takenSpace'], 10)
          }
        },
        { new: true }
      )

      const history = new HistoryDto(
        {
          id: v1(),
          name: user.fio,
          title: task.title,
          helper: 'task',
          date: new Date()
            .toLocaleDateString('ru-RU', { weekday: 'short', hour: 'numeric', minute: 'numeric' })
        }
      )
      const result = await Card.findOneAndUpdate(
        { _id: card._id },
        {
          $addToSet: {
            'history': history,
            'tasks': task
          }
        },
        { new: true }
      )
        .populate('tasks')
        .populate('fields')
        .populate('workers')
        .populate({ path: 'tasks', populate: { path: 'workers' } })
        .lean()

      const createdTask = await newTask.findOne(
        { _id: task._id, cardId: id, companyId: user.companyId }
      )
        .populate('workers')
        .lean()
        .sort({ createdAt: -1 })

      return {
        createdTask, result
      }
    } catch (e) {
      console.log(`newTask service create`, e)
    }
  }
  // not use
  async getTasks ({ userId }) {
    try {
      const user = await User.findById(userId)
      const tasks = (await newTask.find({ companyId: user.companyId })).length
      return tasks
    } catch (e) {
    }
  }

  // not use
  async getCurrentCartTasks ({ id }) {
    try {
      // const tasks = await Cart.findById(id).then(tasks => tasks.currentCartTasks)
      const tasks = await newTask.find({ cardId: id }).lean().sort({ createdAt: -1 })
      // const tasks = await newTask.find({ currentCart: id });
      // console.log(`tasks`, tasks)
      return tasks
    } catch (e) {
    }
  }

  // not use
  async getCurrentUserTasks ({ userId }) {
    try {
      // const tasks = await
      // const tasks = await newTask.find({ currentCart: id });
      // return tasks
    } catch (e) {
    }
  }

  async deleteTask ({ id, cardId }) {
    try {
      const task = await newTask.findById(id)

      await newTask.findByIdAndDelete(id)
      await Card.findOneAndUpdate(
        { _id: cardId },
        {
          $pull: {
            'tasks': task._id
          }
        }
      )
      return true
    } catch (e) {
      console.log(`deleteTask`, e)
    }
  }

  async updateTask ({ id, title, description, date, time, workers, userId }) {
    try {
      const user = await User.findById(userId)

      const task = await newTask.findByIdAndUpdate(
        id,
        {
          $set: {
            'title': title,
            'description': description,
            'date': date,
            'time': time,
            'workers': workers.length ? workers : user
          }
        },
        { new: true }
      ).lean()

      const history = new HistoryDto({
        id: v1(),
        name: user.fio,
        title: title,
        helper: 'updateT',
        date: new Date()
          .toLocaleDateString('ru-RU', { weekday: 'short', hour: 'numeric', minute: 'numeric' })
      })

      const updatedTaskInCard = await Card.findOneAndUpdate(
        {
          _id: task.cardId
        },
        {
          $addToSet: {
            'history': history
          }
        }
      )
        .populate('tasks')
        .populate('fields')
        .populate('workers')
        .populate({ path: 'tasks', populate: { path: 'workers' } })
        .lean()

      return updatedTaskInCard
    } catch (e) {
      console.log(`updateTask`, e)
    }
  }

  async closeTask ({ id, userId, cardId }) {
    try {
      const user = await User.findById(userId).lean()
      const deletedTask = await newTask.findById(id).lean()

      const historyDto = new HistoryDto(
        {
          id: v1(),
          name: user.fio,
          title: deletedTask.title,
          helper: 'close',
          date: new Date()
            .toLocaleDateString('ru-RU', { weekday: 'short', hour: 'numeric', minute: 'numeric' })
        }
      )

      await newTask.findByIdAndUpdate(id, { 'status': 'closed' }, { new: true })
      const updatedCard = await Card.findOneAndUpdate(
        { _id: cardId },
        {
          $pull: {
            'tasks': deletedTask._id
          },
          $addToSet: {
            'history': historyDto
          }
        },
        { new: true }
      )
        .populate('tasks')
        .populate('fields')
        .populate('workers')
        .populate({ path: 'tasks', populate: { path: 'workers' } })
        .lean()

      return updatedCard
    } catch (e) {
      console.log(`closeTask`, e)
    }
  }
}

export const newTaskService = new NewTaskService()
