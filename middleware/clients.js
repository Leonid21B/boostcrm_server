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
              takenSpace: takeSpace(companySpace.takenSpace, 0.001)
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
        const companySpace = await Company.findById(user.companyId)
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
        fields: companySpace.fields,
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
  

    const companySpace = await Company.findById(user.companyId, { space: 1, takenSpace: 1, fields:1})
    console.log(companySpace)
    return {
      clients: clients,
      clientsLength,
      success,
      refusual,
      notDeal,
      fields:companySpace.fields,
      space: companySpace.space,
      takenSpace: isSpaceInteger(companySpace.takenSpace)
    }
  }

  async remove ({ id, userId }) {
    try{
    if(!id){
      return {status:false}
    }
    const deletedClient = await Client.findById(id).lean()
    await Client.findByIdAndDelete(id)
    const user = await User.findById(userId).lean()
    const company = await Company.findOne({_id: user.companyId})
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
        ),
        Company.findOneAndUpdate(
          { _id: user.companyId },
          {
            takenSpace:takeSpace(company.takenSpace,-0.001)
          },
          { new: true }
        )
      ]
    )
    return {status:true, space : takeSpace(company.takenSpace,-0.001)}
    }catch(err) {
      console.log(err)
      return {status:false}
    }
  }

  // not use
  async getCurrent ({ id }) {
    const client = await Client.findById(id).lean()
    let workers = []
    if (client){
       workers = await User.find({companyId:client.companyId})
    }
    return {client,workers}
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
                takenSpace: takeSpace(companySpace.takenSpace, 0.001)
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
      const user = await User.findById(userId)
      const company = await Company.findById(user.companyId)
      if(data.length > 10000){
        const clients = await Client.find({ companyId: user.companyId }).limit(20)
        return {
          space:company.space,
          result: 3,
          clients:clients,
          takenSpace :company.takenSpace
        }
       }
      console.log(`File ${file.name} rows count: ${data.length}`)
      
      const keys = await company.fields.split('|')

      console.log(keys)

      if (!data.length || !JSON.stringify(Object.keys(data[0]).sort()) === JSON.stringify(keys.sort())) {
        throw new Error('Invalid file')
      }

      
      const companyExists = {}
      // const emailExists = {}
      for (let i = 0; i < data.length; i++) {
        console.log(data[i])
        const item = Object.values(data[i])
        console.log(item)
        {/*if (companyExists[item['Организация']]) { // || emailExists[item['E-mail']]) {
          continue
        }*/}
        uploadData.push({
          name: item[0],
          org: item[1],
          iin: item[2],
          tel: item[3],
          email: item[4],
          flag:0,
          userId: user._id,
          comandId: user.comandId,
          companyId: user.companyId
        })
        companyExists[item['Организация']] = true
        // emailExists[item['E-mail']] = true
      }

      const companySpace = await Company.findById(user.companyId, { space: 1, takenSpace: 1 })
      const unit = file.size / 1024 /1024 / 1024

      if(companySpace.space - companySpace.takenSpace > 500/ 1024 / 1024 / 1024 && companySpace.space - unit - companySpace.takenSpace < 500/ 1024 / 1024 / 1024){
        await mailService.sendTarifSize(process.env.MAIL_USER, 500/ 1024, user.email)
      }

      if(companySpace.space - companySpace.takenSpace > 100/ 1024 / 1024 / 1024 && companySpace.space - unit  - companySpace.takenSpace < 100/ 1024 / 1024 / 1024){
        await mailService.sendTarifSize(process.env.MAIL_USER, 100/ 1024, user.email)
      }

      if(companySpace.space - companySpace.takenSpace > 10 / 1024 / 1024 / 1024 && companySpace.space - unit - companySpace.takenSpace < 10/ 1024 / 1024 / 1024){
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
      const result = uploadData.length 
      console.log(result)
      if (result > 0) {
        await Client.insertMany([...uploadData])
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
