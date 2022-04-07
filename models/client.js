import pkg from 'mongoose'
const { Schema, model } = pkg

const ClientSchema = new Schema({
  name: { type: String, default: '' },
  org: { type: String, default: '' },
  iin: { type: String, default: '' },
  tel: { type: String, default: '' },
  email: { type: String, default: '' },
  flag:{ type: Number, default : 1},
  cartId: { type: Schema.Types.ObjectId, ref: 'Card' },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  comandId: { type: Schema.Types.ObjectId, ref: 'ComandOfSale' },
  companyId: { type: Schema.Types.ObjectId, ref: 'Company' }

}, { timestamps: true })

export const Client = model('Client', ClientSchema)
