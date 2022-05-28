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
          takenSpace: takeSpace(companySpace['takenSpace'], 0.001)
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

  async update ({ userId, fields }) {
    console.log(userId,fields)
    const user = await User.findById(userId)
    let company = await Company.findById(user.companyId).lean()
    company = await Company.findByIdAndUpdate({_id:user.companyId},{fields:fields},{new:true})
    console.log(company)
    return company
  }
}

export const newFieldService = new NewFieldService()
