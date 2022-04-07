import { pkg } from 'mongoose'

const { Schema } = pkg

const CardHistorySchema = new Schema({
  name: { type: Schema.Types.String, default: '' }
})

export default CardHistorySchema
