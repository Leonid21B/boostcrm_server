import pkg from 'mongoose'
const { Schema, model, SchemaTypes } = pkg

const ObjectTextSchema = new Schema({
  type: {type: String,default:'text'},
  value: [{type:String}],default: [],
  itemId:{ type: Schema.Types.ObjectId, ref: 'Item' },
  PostId:{ type: Schema.Types.ObjectId, ref: 'Post' },
}, { timestamps: true })

export const ObjectText = model('ObjectText',ObjectTextSchema)