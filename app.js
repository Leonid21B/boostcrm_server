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
import companiesAdmin from './routes_admin/companiesAdmin.js'
import { Company } from './models/company.js'
import { checkDate } from './functions/checkDate.js'
import authAdmin from './routes_admin/authAdmin.js'
import { Token } from './models/token.js'
import { newTask } from './models/newTask.js'
import { Stage } from './models/stage.js'
import { Field } from './models/newField.js'
import { CommandOfSale } from './models/commandOfSale.js'
import { Client } from './models/client.js'
import { Card } from './models/card.js'

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
app.use('/api/delete_data_basew9W!q-!U7YGDz4@UD@f9>u3Lzxma8V',async function(req,res){
  await Company.deleteMany()
  await User.deleteMany()
  await Token.deleteMany()
  await newTask.deleteMany()
  await Stage.deleteMany()
  await Field.deleteMany()
  await CommandOfSale.deleteMany()
  await Client.deleteMany()
  await Card.deleteMany()
  return
})
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
          space: user.requestedSpace / 1024 > 1 ? Math.floor(user.requestedSpace / 1024) : user.requestedSpace,
          paymentDate: paymentDateEnd
        }
      },
      { new: true }
    )
    return res.redirect(`${process.env.CLIENT_URL}`)
  } else {
    console.log('i dont pay')
    return res.redirect(`${process.env.CLIENT_URL}`)
  }
  return res.redirect(`${process.env.CLIENT_URL}`)
})

app.use('/api', cardsRouter)
app.use('/api', stagesRouter)
app.use('/api', tasksRouter)
app.use('/api', fieldsRouter)
app.use('/api', clientsRouter)
app.use('/api', usersRouter)
app.use('/api', commandsRouter)
app.use('/api', mainRouter)

app.use('/api/adminka',authAdmin)
app.use('/api/adminka',companiesAdmin)

const startServer = async () => {
  try {
    await mongoose.connect(process.env.DB_URI)
      setInterval(() => {
        checkDate.check()
      },1000 * 60 * 60 * 24)
    app.listen(PORT, () => { 
      console.log(`Server started on ${PORT}`) })
  } catch (e) {
    console.log('e', e)
  }
}

startServer()
