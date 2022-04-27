import pkg from 'mongoose'
const { Schema, model, SchemaTypes } = pkg

const UserSchema = new Schema({
  fio: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  tel: { type: String, required: true, default: '' },
  password: { type: String, required: true },
  activationlink: { type: String },
  isActivated: { type: Boolean, default: false },
  role: { type: String, default: 'admin' },
  company: { type: String, default: '' },

  companyId: { type: SchemaTypes.ObjectId, ref: 'company' },
  comandId: { type: SchemaTypes.ObjectId, ref: 'comandOfSale' },
  cardId: { type: SchemaTypes.ObjectId, ref: 'card' },

  avatar: { type: String, default: '' },

  currency:{ type: Number, default: 1}, 
  clients: [{ type: SchemaTypes.ObjectId, ref: 'Client' }],
  cards: [{ type: SchemaTypes.ObjectId, ref: 'Card' }],
  successes: [{ type: SchemaTypes.ObjectId, ref: 'Success' }],
  refusals: [{ type: SchemaTypes.ObjectId, ref: 'Refusual' }],
  tasks: [{ type: SchemaTypes.ObjectId, ref: 'Task' }],
  comments: { type: SchemaTypes.Array, default: [] },

  requestedSpace: { type: Number, default: 0 }

}, { timestamps: true })

export const User = model('User', UserSchema)
