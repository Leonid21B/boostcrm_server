import pkg from 'mongoose'
const { Schema, model } = pkg

const NotSuccesCartSchema = new Schema({
  status: {type: String, default: ''},
  title: {type: String, default: ''},
  price: {type: String, default: ''},
  caption: {type: String, default: ''},
  userId: {type: String, default: ''}
}, {timestamps: true})

export const NotSuccesCart = model('Refusual', NotSuccesCartSchema)
