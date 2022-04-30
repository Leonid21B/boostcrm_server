import { Card } from '../models/card.js'
import { Client } from '../models/client.js'
import { CommandOfSale } from '../models/commandOfSale.js'
import { Company } from '../models/company.js'
import { Stage } from '../models/stage.js'
import { User } from '../models/user.js'
import * as XLSX from 'xlsx'
import { takeSpace, isSpaceInteger } from './utils.js'
import { mailService } from './mail.js'

class ClientService {
  async updateFlag(req,res){
    console.log(req.params.id)
    await Client.updateOne({_id:req.params.id},{
        $set: {
              flag:1
          }},
          {
            new: true
          })
    const user = await Client.find({_id:req.params.id})
    return{
      user:user
    }
  }
  async create ({ name, org, iin, tel, email, userId, flag }) {
    const user = await User.findById(userId).lean()
    const client = await Client.create(
      { 
        name: name,
        org: org,
        iin: iin,
        tel: tel,
        email: email,
        userId: userId,
        flag:flag,
        companyId: user.companyId,
        comandId: user.comandId
      }
    )

    const companySpace = await Company.findById(user.companyId, { space: 1, takenSpace: 1 })

    Promise.all(
      [
        Company.findOneAndUpdate(
          { _id: user.companyId },
          {
            $addToSet: {
              clients: client

            },
            $set: {
              takenSpace: takeSpace(companySpace.takenSpace, 10)
            }
          },
          {

            new: true
          }
        ),
        CommandOfSale.findOneAndUpdate(
          { _id: user.comandId },
          {
            $addToSet: {
              clients: client

            }
          },
          {

            new: true
          }
        ),
        User.findOneAndUpdate(
          { _id: user._id },
          {
            $addToSet: {
              clients: client
            }
          },
          {
            new: true
          }
        )
      ]
    )

    const companyResultSpace = await Company.findById(user.companyId, { space: 1, takenSpace: 1 })

    return {
      createdClient: client,
      space: companyResultSpace.space,
      takenSpace: isSpaceInteger(companyResultSpace.takenSpace)
    }
  } 
  async getAllClients (userId) {
    const user = await User.findById(userId).lean()
    const clients = await Client.find({companyId: user.companyId})
    return{
      clients
    }
  }
  async getAll (userId, limit, page) {
    const user = await User.findById(userId).lean()
    const count = await Client.count({ companyId: user.companyId })
    if(page * limit - count >= limit){
        const companySpace = await Company.findById(user.companyId, { space: 1, takenSpace: 1 })

        const clients = await (await Client.find({ companyId: user.companyId }).limit(limit * 1).skip((page - 1) * limit)).reverse()
        const cards = await Card.find({ companyId: user.companyId }).lean()
        const success = cards.filter(card => card.status === 'success') 
        const refusual = cards.filter(card => card.status === 'refusual')
        let notDeal = []
        for(let card of clients){
          if(card.flag == 0){
            notDeal.push(card)
            console.log(card)
          }
          
      }
        return {
        clients: [],
        clientsLength: 0,
        success ,
        refusual ,
        notDeal ,
        space: companySpace.space,
        takenSpace: isSpaceInteger(companySpace.takenSpace)
      }
    }
    const clients = await (await Client.find({ companyId: user.companyId }).limit(limit * 1).skip((page - 1) * limit)).reverse()

    const clientsLength = await Client.find({ companyId: user.companyId }).count()

    const cards = await Card.find({ companyId: user.companyId }).lean()
    const success = cards.filter(card => card.status === 'success')
    const refusual = cards.filter(card => card.status === 'refusual')
    let notDeal = []
    for(let card of clients){
      if(card.flag == 0){
        notDeal.push(card)
        console.log(card)
      }
      
    }
  

    const companySpace = await Company.findById(user.companyId, { space: 1, takenSpace: 1 })

    return {
      clients: clients,
      clientsLength,
      success,
      refusual,
      notDeal,
      space: companySpace.space,
      takenSpace: isSpaceInteger(companySpace.takenSpace)
    }
  }

  async remove ({ id, userId }) {
    const deletedClient = await Client.findById(id).lean()
    const user = await User.findById(userId).lean()

    await Client.findByIdAndDelete(id)

    Promise.all(
      [
        User.findOneAndUpdate(
          { _id: user._id },
          {
            $pull: {
              clients: deletedClient._id
            }
          },
          { new: true }
        ),
        // Card.deleteMany({ clientId: deletedClient._id }),
        CommandOfSale.findOneAndUpdate(
          { _id: user.comandId },
          {
            $pull: {
              clients: deletedClient._id
            }
          },
          { new: true }
        ),
        Company.findOneAndUpdate(
          { _id: user.companyId },
          {
            $pull: {
              clients: deletedClient._id
            }
          },
          { new: true }
        )
      ]
    )
  }

  // not use
  async getCurrent ({ id }) {
    const client = await Client.findById(id).lean()
    return client
  }

  async update ({ id, name, org, iin, tel, email, userId }) {
    try {
      const user = await User.findById(userId).lean()

      const client = await Client.findByIdAndUpdate(
        id,
        { name: name, org: org, iin: iin, tel: tel, email: email },
        { new: true }
      )

      await Card.updateMany({ clientId: client._id }, {
        $set: {
          name: name,
          company: org,
          tel: tel,
          email: email
        }
      }, { new: true })

      const clients = await (await Client.find({ companyId: user.companyId }).lean().limit(20)).reverse()
      return clients
    } catch (error) {
      console.log('updateClient', error)
    }
  }

  async checkClient ({ id, name, org, tel, email, userId }) {
    try {
      const user = await User.findById(userId).lean()

      const client = await Client.findById(id, { _id: 1 }).lean()
      const cards = await Card.find({ clientId: client._id })
        .populate('tasks')
        .populate('fields')
        .populate('workers')
        .lean()
      console.log('client', client)
      console.log('cards', cards)
      const stage = await Stage.findOne({ companyId: user.companyId }).lean()

      if (cards.length > 0) {
        return {
          currentCards: cards,
          hasCards: true
        }
      }

      const card = await Card.create(
        {
          title: 'Новая сделка',
          name: name,
          company: org,
          tel: tel,
          email: email,
          price: 0,
          stageId: stage._id,
          clientId: client._id,
          userId: user._id,
          companyId: user.companyId,
          comandId: user.comandId,
          workers: user
        }
      )

      const companySpace = await Company.findById(user.companyId, { space: 1, takenSpace: 1 })
      Promise.all(
        [
          User.findOneAndUpdate(
            { _id: user._id },
            {
              $addToSet: {
                cards: card
              }
            },
            { new: true }
          ),
          CommandOfSale.findOneAndUpdate(
            { _id: user.comandId },
            {
              $addToSet: {
                cards: card
              }
            },
            { new: true }
          ),
          Company.findOneAndUpdate(
            { _id: user.companyId },
            {
              $addToSet: {
                cards: card
              },
              $set: {
                takenSpace: takeSpace(companySpace.takenSpace, 10)
              }
            },
            { new: true }
          )
        ]
      )

      const companyResultSpace = await Company.findById(user.companyId, { space: 1, takenSpace: 1 })
      const populatedCard = await Card.findById(card._id)
        .populate('workers')
        .populate('tasks')

      return {
        cardId: card._id,
        card: populatedCard,
        hasCards: false,
        space: companyResultSpace.space,
        takenSpace: isSpaceInteger(companyResultSpace.takenSpace)
      }
    } catch (error) {
      console.log('checkClient', error)
    }
  }

  async updateClientFields ({ fields, userId }) {
    const user = await User.findById(userId, { companyId: 1 }).lean()
    // const clients = await Client.find({ companyId: user.companyId })
    await Client.updateMany({ companyId: user.companyId }, { $set: { new_field: 'w' } }, { new: true, multi: true })
    // const client = await Client.aggregate([
    //     { $match: { _id: ObjectId(userId) } },
    //     {
    //         $addFields:{
    //             't1':'2'
    //         }
    //     },
    // ])
    // console.log(`client`, client)
  }

  async uploadClientFromFile (file, userId) {
    try {
      console.log('file', file)
      const workBook = XLSX.read(file.data, { type: 'buffer' })
      const workSheetName = workBook.SheetNames[0]
      const workSheet = workBook.Sheets[workSheetName]
      const data = XLSX.utils.sheet_to_json(workSheet)
      console.log('data.length', data.length)
      const uploadData = []

      console.log(`File ${file.name} rows count: ${data.length}`)

      // Check structure
      const keys = ['Ф.И.О', 'Организация', 'ИНН', 'Телефон', 'E-mail']
      if (!data.length || !JSON.stringify(Object.keys(data[0]).sort()) === JSON.stringify(keys.sort())) {
        throw new Error('Invalid file')
      }

      const user = await User.findById(userId)
      const companyExists = {}
      // const emailExists = {}
      for (let i = 0; i < data.length; i++) {
        const item = data[i]
        if (companyExists[item['Организация']]) { // || emailExists[item['E-mail']]) {
          continue
        }
        uploadData.push({
          name: item['Ф.И.О'],
          org: item['Организация'],
          iin: item['ИНН'],
          tel: item['Телефон'],
          email: item['E-mail'],
          userId: user._id,
          comandId: user.comandId,
          companyId: user.companyId
        })
        companyExists[item['Организация']] = true
        // emailExists[item['E-mail']] = true
      }

      const companySpace = await Company.findById(user.companyId, { space: 1, takenSpace: 1 })
      const unit = file.size / 1024

      console.log('uploadedData.length', uploadData.length)
      if(companySpace.space - companySpace.takenSpace > 500 && companySpace.space - unit - companySpace.takenSpace < 500){
        await mailService.sendTarifSize(process.env.MAIL_USER, 500, user.email)
      }

      if(companySpace.space - companySpace.takenSpace > 100 && companySpace.space - unit  - companySpace.takenSpace < 100){
        await mailService.sendTarifSize(process.env.MAIL_USER, 100, user.email)
      }

      if(companySpace.space - companySpace.takenSpace > 10 && companySpace.space - unit - companySpace.takenSpace < 10){
        await mailService.sendTarifSize(process.env.MAIL_USER, 10, user.email)
      }

      await Company.findOneAndUpdate(
        { _id: user.companyId },
        {
          $set: {
            takenSpace: takeSpace(companySpace.takenSpace, unit)
          }
        },
        { new: true }
      )
      
      const companyResultSpace = await Company.findById(user.companyId, { space: 1, takenSpace: 1 })
      const result = uploadData.length > 0
      if (result) {
        await Client.insertMany(uploadData)
      }

      const clients = await Client.find({ companyId: user.companyId }).limit(20)
      // return clients
      return {
        result,
        clients,
        space: companyResultSpace.space,
        takenSpace: isSpaceInteger(companyResultSpace.takenSpace)
      }
    } catch (error) {
      console.log('uploadClientFromFile', error)
    }
  }
}

export const clientService = new ClientService()
