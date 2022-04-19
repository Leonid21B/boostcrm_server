import pkg from 'mongoose'
const { Schema, model, SchemaTypes } = pkg

const FieldSchema = new Schema({
  title: { type: String, required: true },
  value: {type: String, default: ''},
  deleted:{type: Boolean, default:false},
  cardId: { type: Schema.Types.ObjectId, ref: 'Card' }
}, {timestamps: true})

export const Field = model('Field', FieldSchema)
