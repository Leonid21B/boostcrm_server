import { v1 } from 'uuid'
import HistoryDto from '../dto/history.js'
import { takeSpace } from './utils.js'
import { Card } from '../models/card.js'
import { Company } from '../models/company.js'
import { Field } from '../models/newField.js'
import { User } from '../models/user.js'

class NewFieldService {
  async create ({ title, value, id, userId }) {
    const user = await User.findById(userId)

    const newField = await Field.create({ title, value, cardId: id })
    const companySpace = await Company.findById(user.companyId, { takenSpace: 1 }).lean()

    const history = new HistoryDto(
      {
        id: v1(),
        name: user.fio,
        title: `${newField.title}`,
        helper: 'create-field',
        date: new Date()
          .toLocaleDateString('ru-RU', { weekday: 'short', hour: 'numeric', minute: 'numeric' })
      }
    )

    const card = await Card.findOneAndUpdate(
      { _id: id },
      {
        $addToSet: {
          'fields': newField,
          history: history
        }
      },
      { new: true }
    )
      .populate('tasks')
      .populate('fields')
      .populate('workers')
      .populate({ path: 'tasks', populate: { path: 'workers' } })
      .lean()

    await Company.findOneAndUpdate(
      { _id: user.companyId },
      {
        $set: {
          takenSpace: takeSpace(companySpace['takenSpace'], 10)
        }
      },
      { new: true }
    )
    return card
  }
  // not use
  async get ({ cardId }) {
    const fields = await Card.findById(cardId).lean().then(crd => crd.fields)
    return fields
  }

  async update ({ cardId, fieldId, val, userId }) {
    const user = await User.findById(userId).lean()
    const field = await Field.findById(fieldId).lean()

    const history = new HistoryDto(
      {
        id: v1(),
        name: user.fio,
        title: `${field.value} на ${val}`,
        helper: 'update-field',
        date: new Date()
          .toLocaleDateString('ru-RU', { weekday: 'short', hour: 'numeric', minute: 'numeric' })
      }
    )
    await Field.findByIdAndUpdate(fieldId, { value: val }, { new: true })
    await Card.findOneAndUpdate(
      { _id: cardId },
      {
        $addToSet: {
          'history': history
        }
      },
      { new: true }
    )
    const card = await Card.findById(cardId)
      .populate('tasks')
      .populate('workers')
      .populate('fields')
      .populate({ path: 'tasks', populate: { path: 'workers' } })
      .lean()

    return card
  }
}

export const newFieldService = new NewFieldService()
