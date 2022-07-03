import pkg from 'mongoose'
const { Schema, model, SchemaTypes } = pkg

const ItemSchema = new Schema({
  zag: {type: String,default:''},
  objects:[{type: Schema.Types.ObjectId,ref: 'ObjectText'}],
  PostId:{ type: Schema.Types.ObjectId, ref: 'Post' },
}, { timestamps: true })

export const Item =  model('Item',ItemSchema)