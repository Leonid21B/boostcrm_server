import pkg from 'mongoose'
const { Schema, model, SchemaTypes } = pkg

const CommandOfSaleSchema = new Schema({
  title: { type: String, default: '' },
  comandImg: { type: String, default: '' },

  companyId: { type: SchemaTypes.ObjectId, ref: 'company' },
  users: [{ type: SchemaTypes.ObjectId, ref: 'User' }],
  cards: [{ type: SchemaTypes.ObjectId, ref: 'Card' }],
  clients: [{ type: SchemaTypes.ObjectId, ref: 'Client' }],
  successes: [{ type: SchemaTypes.ObjectId, ref: 'Success' }],
  refusals: [{ type: SchemaTypes.ObjectId, ref: 'Refusual' }]

}, { timestamps: true })

export const CommandOfSale = model('ComandOfSale', CommandOfSaleSchema)
