import pkg from 'mongoose'
const { Schema, model, SchemaTypes } = pkg

const PostSchema = new Schema({
  zag: {type: String,default:''},
  items: [{type:Schema.Types.ObjectId}],default: [],
  imgref:{ type: String, default: '' },
  startedText:{ type: String, default: '' }
}, { timestamps: true })

export const Post = model('Post',PostSchema)