import express from 'express'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import fileUpload from 'express-fileupload'
import cardsRouter from './routes/cards.js'
import stagesRouter from './routes/stages.js'
import tasksRouter from './routes/tasks.js'
import fieldsRouter from './routes/fields.js'
import clientsRouter from './routes/clients.js'
import usersRouter from './routes/users.js'
import commandsRouter from './routes/commands.js'
import mainRouter from './routes/main.js'
import { User } from './models/user.js'
import { Company } from './models/company.js'

dotenv.config()

const app = express()

const PORT = process.env.PORT

app.use(express.json())
app.use(fileUpload({}))

app.use(cors({
  credentials: true,
  origin: process.env.CLIENT_URL
}))

app.use(cookieParser())

app.use('/avatars', express.static(`${process.env.FILE_STATIC_PATH}\\avatars`))
app.use('/files', express.static(`${process.env.FILE_STATIC_PATH}\\files`))

app.use('/api/checkPayment', async function (req, res, next) {
  console.log('req.card', req.body)
  const userId = req.body.object.description.split('|')[0]
  console.log('userid check status of payment', userId)
  const user = await User.findById(userId)

  console.log('user', user)
  if (!user) {
    console.log(`${process.env.CLIENT_URL}/popup`)
    return res.redirect(`${process.env.CLIENT_URL}`)
  }

  const isPayid = req.body.object
  const company = await Company.findOne({_id: user.companyId})
  const paymentDateEnd = new Date(company.paymentDate)
  console.log(user)
  console.log(userId)

  paymentDateEnd.setMonth(paymentDateEnd.getMonth() + 1)
  console.log('paymentDateEnd', paymentDateEnd)
  console.log(req.body)
  if (user.id === userId && isPayid.paid) {
    await Company.findOneAndUpdate(
      { _id: user.companyId },
      { 
        $set: {
          space: user.requestedSpace,
          paymentDate: paymentDateEnd
        }
      },
      { new: true }
    )
    return
    console.log('user gb', user.requestedSpace)
  } else {
    console.log('i dont pay')
    next()
  }
})

app.use('/api', cardsRouter)
app.use('/api', stagesRouter)
app.use('/api', tasksRouter)
app.use('/api', fieldsRouter)
app.use('/api', clientsRouter)
app.use('/api', usersRouter)
app.use('/api', commandsRouter)
app.use('/api', mainRouter)

const startServer = async () => {
  try {
    await mongoose.connect(process.env.DB_URI)
    app.listen(PORT, () => { console.log(`Server started on ${PORT}`) })
  } catch (e) {
    console.log('e', e)
  }
}

startServer()
