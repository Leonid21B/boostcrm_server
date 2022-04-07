import pkg from 'mongoose'
import { Field } from './newField.js'
import { newTask } from './newTask.js'
const { Schema, model, SchemaTypes } = pkg

const CardSchema = new Schema({
  title: { type: String, required: true, default: '' },
  company: { type: String, default: '' },
  name: { type: String, default: '' },
  price: { type: Number, default: 0 },
  tel: { type: String, default: '' },
  email: { type: String, default: '' },
  address: { type: String, default: '' },
  day: { type: Date, default: Date.now },
  helper: { type: String, default: 'cart' },
  status: { type: String, default: 'active' },

  clientId: { type: SchemaTypes.ObjectId, ref: 'Client' },
  comandId: { type: SchemaTypes.ObjectId, ref: 'ComandOfSale' },
  stageId: { type: Schema.Types.ObjectId, ref: 'Stage' },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },

  workers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  companyId: { type: Schema.Types.ObjectId, ref: 'Company' },
  tasks: [{ type: SchemaTypes.ObjectId, ref: 'Task' }],
  fields: [{ type: SchemaTypes.ObjectId, ref: 'Field' }],
  comments: { type: SchemaTypes.Array, default: [] },
  history: { type: SchemaTypes.Array, default: [] }

}, { timestamps: true })

CardSchema.pre(
  'deleteOne',
  async function (next) {
    await newTask.deleteMany({ cardId: this.getQuery()._id })
    await Field.deleteMany({ cardId: this.getQuery()._id })
    next()
  }
)

export const Card = model('Card', CardSchema)
