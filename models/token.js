import pkg from 'mongoose'
const { Schema, model, SchemaTypes } = pkg

const TokenSchema = new Schema({
  user: {type: SchemaTypes.ObjectId, ref: 'user'},
  refreshToken: {type: String, required: true}
}, {timestamps: true})

export const Token = model('token', TokenSchema)
