import pkg from 'mongoose'
const { Schema, model, SchemaTypes } = pkg

const WorkerSchema = new Schema({
  avatar: {type: String, default: ''},
  fio: {type: String, default: ''},
  role: {type: String, default: 'user'},
  tel: {type: String, default: ''},
  email: {type: String, default: ''},
  password: {type: String, default: ''},
  inviteLink: {type: String, default: ''},
  isActivated: {type: Boolean, default: false},
  comandOfSale: {type: SchemaTypes.ObjectId, ref: 'comandOfSale'}

}, {timestamps: true})

export const Worker = model('worker', WorkerSchema)
