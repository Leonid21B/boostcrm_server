import pkg from 'mongoose'
const { Schema, model, SchemaTypes } = pkg

const StageSchema = new Schema({
  title: { type: String, required: true },
  companyId: { type: Schema.Types.ObjectId, ref: 'company' },
  stageImg: { type: String, default: '' },
  cards: [{ type: Schema.Types.ObjectId, ref: 'Card' }]

}, { timestamps: true })

export const Stage = model('Stage', StageSchema)
