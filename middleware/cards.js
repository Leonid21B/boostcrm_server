import { Card } from '../models/card.js'
import { Client } from '../models/client.js'
import { CommandOfSale } from '../models/commandOfSale.js'
import { Company } from '../models/company.js'
import { Stage } from '../models/stage.js'
import { User } from '../models/user.js'
import HistoryDto from '../dto/history.js'
import fs, { existsSync } from 'fs'
import { v1 } from 'uuid'
import { sortCards, isSpaceInteger, takeSpace } from './utils.js'
import { mailService } from './mail.js'

class CardService {
  async create ({ title, company, name, price, tel, email, address, stageId, userId, comandId }) {
    try {
      const user = await User.findById(userId).lean()
      const stage = await Stage.findById(stageId).lean()

      const client = await Client.findOne({ org: company }).lean()

      console.log('client', client)

      let newClient = null
      if (!client) {
        newClient = await Client.create(
          {
            name: name,
            org: company,
            tel: tel,
            email: email,
            userId: userId,
            companyId: user.companyId,
            comandId: comandId
          }
        )
        Promise.race(
          [
            User.updateOne(
              { _id: user._id },
              { $addToSet: { 'clients': newClient } },
              { new: true }
            ),
            Company.findOneAndUpdate(
              { _id: user.companyId },
              {
                $addToSet: {
                  'clients': newClient
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
                  'clients': newClient
                }
              },
              {
                new: true
              }
            )
          ]
        )
      } else {
        newClient = client
      }

      console.log('newClient', newClient)

      // TODO: Разобраться
      const checkedPrice = price.length === 0 ? 0 : price

      const historyDto = new HistoryDto(
        {
          id: v1(),
          name: user.fio,
          title: title,
          helper: 'create',
          date: new Date().toLocaleDateString('ru-RU', { weekday: 'short', hour: 'numeric', minute: 'numeric' })
        }
      )

      const card = await Card.create(
        {
          title,
          company,
          name,
          price: checkedPrice,
          tel,
          email,
          address,
          stageId: stageId,
          userId: user._id,
          comandId: user.comandId,
          clientId: newClient._id,
          companyId: user.companyId,
          workers: user,
          history: historyDto
        }
      )

      const companySpace = await Company.findById(user.companyId, { space: 1, takenSpace: 1 }).lean()

      await Promise.all([
        User.updateOne(
          { _id: user._id },
          { $addToSet: { 'cards': card } },
          { new: true }
        ),
        Company.findOneAndUpdate(
          { _id: user.companyId },
          {
            $set: {
              takenSpace: takeSpace(companySpace['takenSpace'], 0.001)
            },
            $addToSet: {
              'cards': card
            }
          },
          { new: true }
        ),
        CommandOfSale.findOneAndUpdate(
          { _id: user.comandId },
          {
            $addToSet: {
              'cards': card
            }
          },
          { new: true }
        ),
        Stage.findOneAndUpdate(
          { _id: stage._id },
          {
            $addToSet: {
              'cards': card
            }
          },
          { new: true }
        )
      ])

      const resultCard = await Card.findOne(
        { _id: card._id, companyId: user.companyId }
      )
        .populate('tasks')
        .populate('fields')
        .populate('workers')
        .lean()

      const companyResultSpace = await Company.findById(user.companyId, { space: 1, takenSpace: 1 }).lean()
      console.log(companyResultSpace['takenSpace'])
      const takenSpace = isSpaceInteger(companyResultSpace['takenSpace'])
      console.log(takenSpace)
      return {
        resultCard,
        space: companyResultSpace['space'],
        takenSpace
      }
    } catch (e) {
      console.log(`cart service create`, e)
    }
  }

  // not use
  async getAll ({ userId, comandId }) {
    try {
      const user = await User.findById(userId)

      const cards = await (await Card.find({ companyId: user.companyId }).populate('tasks'))
        .sort((a, b) => sortCards(a, b))
        .filter(card => card.status === 'active')
      // { $match: { 'cards.status' 'active' } },
      // const cards = await Company.aggregate([
      //     { $match: { '_id': user.companyId } },
      //     {
      //         $sort: {
      //             createdAt: -1
      //         }
      //     },
      //     {
      //         $lookup: {
      //             from: 'Card',
      //             localField: 'title',
      //             foreignField:'title',
      //             as: 'cards'
      //         }
      //     },
      //     {
      //         $project: {
      //             _id: 0,
      //             cards: {
      //                 $filter: {
      //                     input: '$cards',
      //                     as: 'card',
      //                     cond: { $eq: ['$$card.status', 'active'] }
      //                 }
      //             }
      //         }
      //     }
      // ])

      // console.log(`cards`, cards)
      // console.log(`test`, test)
      // const carts = await Cart.find({ userId: userId })
      // const checkUser = await User.findById(userId)
      // if (checkUser.role != 'admin') {
      //     const carts = await Cart.find({ commandOfSale: comandId })
      //     return carts
      // }
      // const carts = await Cart.find({ userId:userId })
      return cards

      // await User.findByIdAndUpdate({_id:userId}, { linkToCarts: carts }, { new: true })
    } catch (e) {
      console.log(`cart service get all`, e)
    }
  }

  async getOne ({ id }) {
    try {
      const card = await Card.findById(id)
        .populate('tasks')
        .populate('fields')
        .populate('workers')
        .populate({ path: 'tasks', populate: { path: 'workers' } })
        .lean()
      // .then(card => card.tasks.filter(item => item.status == 'active'))

      return { card: card }
    } catch (e) {
      console.log(`cart service get one`, e)
    }
  }

  // not use
  async getCardHistory ({ id }) {
    try {
      const cart = await Card.findById(id).lean().then(card => card?.history)
      return cart
    } catch (e) {
      console.log(`cart service get one`, e)
    }
  }

  async delete ({ id, userId }) {
    try {
      const user = await User.findById(userId).lean()
      
      const deletedCard = await Card.findById(id).lean()
      const company = await Company.findOne({_id:user.companyId})
      await Company.findOneAndUpdate({_id:user.companyId},{takenSpace:takeSpace(company.takenSpace,-deletedCard.tasks.length * 0.001 - 0.001)})
     
      await Card.deleteOne({ _id: deletedCard._id })

      await Promise.all(
        [
          User.updateOne(
            { _id: userId },
            { $pull: { 'cards': deletedCard._id } },
            { new: true }
          ),
          CommandOfSale.findOneAndUpdate(
            { _id: user.comandId },
            {
              $pull: {
                'cards': deletedCard._id
                // 'cards.$[userid]': { userId: user._id }
              }
            },
            { new: true }
          ),
          Company.findOneAndUpdate(
            { _id: user.companyId },
            {
              $pull: {
                'cards': deletedCard._id
              }
            },
            { new: true }
          ),
          Stage.findOneAndUpdate(
            { _id: deletedCard.stageId },
            {
              $pull: {
                'cards': deletedCard._id
              }
            },
            { new: true }
          )
          // newTask.deleteMany(
          //     { cardId: deletedCard._id },
          //     { new: true }
          // )
        ]
      )

      return true
    } catch (e) {
      console.log(`cart service delete`, e)
    }
  }

  async createCardComment ({ text, cardId, userId }) {
    const user = await User.findById(userId).lean()
    const card = await Card.findById(cardId).lean()

    // const comment = new HistoryDto(
    //     {
    //         id: v1(),
    //         name: user.fio,
    //         title: `${text}`,
    //         helper: 'write',
    //         cardId: card._id,
    //         date: new Date()
    //             .toLocaleDateString('ru-RU', { weekday: 'short', hour: 'numeric', minute: 'numeric' }),
    //         createdAt: new Date()
    //     }
    // )
    const comment = {
      id: v1(),
      name: user.fio,
      title: `${text}`,
      helper: 'write',
      cardId: card._id,
      date: new Date()
        .toLocaleDateString('ru-RU', { weekday: 'short', hour: 'numeric', minute: 'numeric' }),
      createdAt: new Date(),
      userId: user._id
    }

    // console.log('comment', comment);
    await Card.findOneAndUpdate(
      { _id: card._id },
      {
        $addToSet: {
          'history': comment
        }
      }
    )
    await User.findByIdAndUpdate(
      user._id,
      {
        $addToSet: {
          'comments': comment
        }
      }
    )
  }

  // async updateCart({ company, name, price, tel, email, address, id, userId }) {
  async update ({ field, typeOfField, id, userId }) {
    try {
      const updatedCard = await Card.findById(id).lean()

      const fields = { name: 'Имя', tel: 'Телефон', email: 'E-mail', company: 'Компания', address: 'Адрес' }

      const user = await User.findById(userId).lean()

      if (typeOfField === 'PRICE') {
        // const client = await Client.findById(updatedCard.clientId).lean()

        const history = new HistoryDto(
          {
            id: v1(),
            name: user.fio,
            title: `Цена ${updatedCard.price} на ${field}`,
            helper: 'update',
            date: new Date()
              .toLocaleDateString('ru-RU', { weekday: 'short', hour: 'numeric', minute: 'numeric' })
          }
        )
        await Card.updateOne(
          { _id: updatedCard._id },
          {
            $set: {
              price: field
            },
            $addToSet: {
              history: history
            }
          },
          { new: true }
        )
        return
      }

      const client = await Client.findByIdAndUpdate(
        updatedCard.clientId,
        { [typeOfField.toLowerCase() === 'company' ? 'org' : typeOfField.toLowerCase()]: field },
        { new: true }
      )

      const history = new HistoryDto(
        {
          id: v1(),
          name: user.fio,
          title: `${fields[typeOfField.toLowerCase()]} ${updatedCard[typeOfField.toLowerCase()]} на ${field}`,
          helper: 'update',
          date: new Date()
            .toLocaleDateString('ru-RU', { weekday: 'short', hour: 'numeric', minute: 'numeric' })
        }
      )

      await Card.updateMany(
        { clientId: client._id },
        {
          [typeOfField.toLowerCase()]: field,
          $addToSet: {
            'history': history
          }
        },
        { new: true }
      )
    } catch (e) {
      console.log(`cart service updateCart`, e)
    }
  }

  async updateCartStage ({ currentStage, id, userId }) {
    try {
      const user = await User.findById(userId)
      const card = await Card.findById(id, { stageId: 1, userId: 1, title: 1 }).lean()
      const stage = await Stage.findById(currentStage).lean()

      const history = new HistoryDto(
        {
          id: v1(),
          name: user.fio,
          title: `${stage.title}`,
          helper: 'update-stage',
          date: new Date().toLocaleDateString('ru-RU', { weekday: 'short', hour: 'numeric', minute: 'numeric' })

        }
      )

      // const user = await User.findById(card.userId).lean()

      Promise.all(
        [
          Stage.findOneAndUpdate(
            { _id: card.stageId },
            {
              $pull: {
                'cards': card._id
              }
            },
            { new: true }
          ),
          Stage.findOneAndUpdate(
            { _id: stage._id },
            {
              $addToSet: {
                'cards': card
              }
            },
            { new: true }
          )
        ]
      )

      await Card.findByIdAndUpdate(id, {
        stageId: currentStage,
        $addToSet: {
          history: history
        }
      }, { new: true })

      return true
    } catch (e) {
      console.log(`cart service updateCartStage`, e)
    }
  }

  async updateCartWorker ({ id, workerId, userId, typeOfDoing }) {
    const card = await Card.findById(id)
    const user = await User.findById(workerId)

    if (typeOfDoing === 'ADD_WORKER') {
      await Card.findOneAndUpdate(
        { _id: card._id },
        {
          $addToSet: {
            'workers': user
          }
        },
        { new: true }
      )
      await User.findOneAndUpdate(
        { _id: user._id },
        {
          $addToSet: {
            'cards': card
          }
        },
        { new: true }
      )
      return true
    }

    await Card.findOneAndUpdate(
      { _id: card._id },
      {
        $pull: {
          'workers': user._id
        }
      },
      { new: true }
    )
    await User.findOneAndUpdate(
      { _id: user._id },
      {
        $pull: {
          'cards': card._id
        }
      }
    )
    return true
  }

  async updateCardStatus ({ type, cardId, message, userId, helper }) {
    try {
      const user = await User.findById(userId)
      const history = new HistoryDto(
        {
          id: v1(),
          name: user.fio,
          title: message,
          helper: helper,
          date: new Date().toLocaleDateString('ru-RU', { weekday: 'short', hour: 'numeric', minute: 'numeric' })
        }
      )
      await Card.findOneAndUpdate(
        { _id: cardId },
        {
          $set: {
            'status': type
          },
          $addToSet: {
            history: history
          }
        },
        { new: true }
      )
      return true
    } catch (error) {
      console.log(`updateCardStatus`, error)
    }
  }

  async updateCardTitle ({ cardId, title }) {
    try {
      const result = await Card.findOneAndUpdate(
        {
          _id: cardId
        },
        {
          $set: {
            'title': title
          }
        },
        {
          new: true
        }
      ).populate('tasks')
        .populate('workers')
        .populate('workers')
        .populate({ path: 'tasks', populate: { path: 'workers' } })
        .lean()

      return result
    } catch (error) {
      console.log(`updateCardTitle error`, error)
    }
  }

  async uploadFile ({ file, cardId, userId }) {
    try{
    console.log('file', file)

    let resultFile = null
    switch (file.mimetype) {
      case 'text/plain':
        resultFile = `${v1()}.txt`
        break
      case 'image/jpeg':
        resultFile = `${v1()}.jpg`
        break
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        resultFile = `${v1()}.xlsx`
        break
      case 'application/json':
        resultFile = `${v1()}.json`
        break
      case 'image/png':
        resultFile = `${v1()}.png`
        break
      case 'application/pdf':
        resultFile = `${v1()}.pdf`
        break
      case 'application/x-tar':
        resultFile = `${v1()}.tar`
        break
      default:
        resultFile = `${v1()}.${file.mimetype.split('/').pop()}`
        break
    }
    const user = await User.findById(userId)
    const fileSize = file.size / 1024 /1024 / 1024
    const companySpace = await Company.findById(user.companyId, { space: 1, takenSpace: 1 })
    if(companySpace.space - companySpace.takenSpace > 500/ 1024 / 1024 / 1024 && companySpace.space - fileSize - companySpace.takenSpace < 500 /1024 / 1024 / 1024){
        await mailService.sendTarifSize(process.env.MAIL_USER, 500, user.email)
      }

      if(companySpace.space - companySpace.takenSpace > 100/ 1024 / 1024 / 1024 && companySpace.space - fileSize- companySpace.takenSpace< 100/ 1024 / 1024 / 1024 / 1024){
        await mailService.sendTarifSize(process.env.MAIL_USER, 100, user.email)
      }

      if(companySpace.space - companySpace.takenSpace > 10/ 1024 / 1024 / 1024 && companySpace.space - fileSize - companySpace.takenSpace < 10/ 1024 / 1024 / 1024){
        await mailService.sendTarifSize(process.env.MAIL_USER, 10, user.email)
      }
    const fullPath = `${process.env.FILE_STATIC_PATH}/files`
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath)
    }

    file.mv(`${fullPath}/${resultFile}`)

    
    const history = new HistoryDto(
      {
        id: v1(),
        name: user.fio,
        title: resultFile,
        helper: 'download',
        date: new Date().toLocaleDateString('ru-RU', { weekday: 'short', hour: 'numeric', minute: 'numeric' }),
        deleted :false,
      }
    )

    const card = await Card.findOneAndUpdate(
      { _id: cardId },
      {
        $addToSet: {
          history: history
        }
      },
      { new: true }
    ).populate('workers').populate('tasks').populate('fields').populate({ path: 'tasks', populate: { path: 'workers' } })

    
    await Company.findOneAndUpdate(
      { _id: user.companyId },
      {
        $set: {
          takenSpace: takeSpace(companySpace['takenSpace'], fileSize)
        }
      }
    )
    return card
    }catch(error){
      console.log(error)
    }
  }
  async deleteFile ({cardId, fileName }) {
    try{
      let newCard = await Card.findOne({_id:cardId})
      const fullPath = `${process.env.FILE_STATIC_PATH}/files`
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath)
      }
      if(fs.existsSync(`${fullPath}/${fileName}`)){
      const card = await Card.findOne({_id: cardId})
      
      let history = card.history

      let historyItem = history.filter(item => item.title == fileName)[0]
      historyItem.deleted = true
      historyItem.date = new Date().toLocaleDateString('ru-RU', { weekday: 'short', hour: 'numeric', minute: 'numeric' })
      history = history.filter(item => item.title != fileName)
      history.push(historyItem)

      newCard = await Card.findOneAndUpdate({_id: cardId},{history:history},{new:true})

      console.log(newCard)
      const user = await User.findOne({_id:card.userId})

      const companySpace = await Company.findById(user.companyId, { space: 1, takenSpace: 1 })
      let newWeigth = companySpace.takenSpace
      console.log(companySpace)
    
      const stat = fs.statSync(`${fullPath}/${fileName}`)
      console.log(newWeigth)
      newWeigth -= stat.size / 1024 / 1024 / 1024
      console.log(newWeigth)

      await Company.findOneAndUpdate(
        { _id: user.companyId },
        {
          $set: {
            takenSpace: newWeigth
          }
        }
      )
      fs.unlinkSync(`${fullPath}/${fileName}`)
    }
      
    return newCard
    }catch(error){
      console.log(error)
    }
  }
  
}

export const cardService = new CardService()
