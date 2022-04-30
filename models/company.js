import pkg from 'mongoose'
const { Schema, model, SchemaTypes } = pkg

const CompanySchema = new Schema({
  cards: [{ type: SchemaTypes.ObjectId, ref: 'Card' }],
  stages: [{ type: SchemaTypes.ObjectId, ref: 'Stage' }],
  successes: [{ type: SchemaTypes.ObjectId, ref: 'Success' }],
  refusals: [{ type: SchemaTypes.ObjectId, ref: 'Refusual' }],
  users: [{ type: SchemaTypes.ObjectId, ref: 'User' }],
  clients: [{ type: SchemaTypes.ObjectId, ref: 'Client' }],
  comandOfSale: [{ type: SchemaTypes.ObjectId, ref: 'ComandOfSale' }],

  fields: {type: String, default: 'Ф.И.О|Организация|ИНН|Телефон|E-mail'},
  space: { type: Number, default: 0 },
  takenSpace: { type: Number, default: 0 },
  paymentDate: { type: Date, default: Date.now() }

}, { timestamps: true })

export const Company = model('Company', CompanySchema)
