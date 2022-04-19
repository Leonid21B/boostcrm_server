import pkg from 'mongoose'
const { Schema, model, SchemaTypes } = pkg

const NewtaskSchema = new Schema({
  title: { type: String },
  description: { type: String },
  date: { type: Date },
  time: { type: String },
  cardId: { type: Schema.Types.ObjectId, ref: 'Card' },
  helper: { type: String, default: 'task' },
  status: { type: String, default: 'active' },
  // userId:{type:Schema.Types.ObjectId,ref:'user'},
  userId: { type: SchemaTypes.ObjectId, ref: 'User' },
  workers: [{ type: SchemaTypes.ObjectId, ref: 'User' }],
  deleted: { type: Boolean },
  clientId: { type: Schema.Types.ObjectId, ref: 'Client' },
  companyId: { type: Schema.Types.ObjectId, ref: 'Company' },
  comandId: { type: Schema.Types.ObjectId, ref: 'ComandOfSale' }

}, { timestamps: true })

export const newTask = model('Task', NewtaskSchema)
