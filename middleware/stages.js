import { isSpaceInteger, takeSpace } from './utils.js'
import { Card } from '../models/card.js'
import { Company } from '../models/company.js'
import { Stage } from '../models/stage.js'
import { User } from '../models/user.js'

class StageService {
  async create ({ title, img, userId }) {
    try {
      const user = await User.findById(userId).lean()
      const stage = await Stage.create({ title: title, stageImg: img, companyId: user.companyId })

      const companySpace = await Company.findById(user.companyId, { takenSpace: 1 })

      const companyResultSpace = await Company.findOneAndUpdate(
        { _id: user.companyId },
        {
          $addToSet: { 
            'stages': stage
          },
          $set: {
            takenSpace: takeSpace(companySpace['takenSpace'], 0.001)
          }
        },
        {
          new: true
        }
      )

      return {
        stage,
        space: companyResultSpace['space'],
        takenSpace: isSpaceInteger(companyResultSpace['takenSpace'])
      }
    } catch (e) {
      console.log(`create satge servece`, e)
    }
  }

  // notUsed
  async getAll ({ userId, comandId }) {
    try {
      const user = await User.findById(userId).lean()
      const stages = await Company.findById(user.companyId)
        .populate('stages')
        .populate({ path: 'stages', populate: { path: 'cards' } })
        .then(company => company.stages)
      return stages
    } catch (e) {
      console.log(`get all satge servece`, e)
    }
  }

  // maybe not used
  async getOne ({ id }) {
    try {
      if (!id) {
        // TODO: check
        // return res.json('not id')
      }
      const stages = await Stage.findById(id).lean()
      return stages
    } catch (e) {
      console.log(`get one satge servece`, e)
    }
  }

  async update ({ id, title, img, userId }) {
    try {
      await Stage.findByIdAndUpdate(id, { 'title': title, stageImg: img })

      const user = await User.findById(userId)
      const stages = await Stage.find({ companyId: user.companyId })

      return stages
    } catch (error) {
      console.log(`stage update`, error)
    }
  }

  async delete ({ id, userId, transferto }) {
    try {
      if (!id) {
        // TODO: check
        // return res.json('not id')
      }

      // TODO: check
      // const user = await User.findById(userId).lean()
      console.log('deleteStage!!!!!!!!')
      console.log('deleteStage!!!!!!!!')
      console.log('deleteStage!!!!!!!!')
      console.log('deleteStage!!!!!!!!')
      console.log('deleteStage!!!!!!!!')
      console.log('deleteStage!!!!!!!!')
      console.log('deleteStage!!!!!!!!')
      console.log('deleteStage!!!!!!!!')
      const stage = await Stage.findById(id).lean()
      const newStage = await Stage.findOne({ _id: transferto }).lean()
      const company = await Company.findOne({_id:stage.companyId})
      const resCompany = await Company.findOneAndUpdate({_id:stage.companyId},{takenSpace:takeSpace(company.takenSpace,-0.001)},{new:true})
      await Stage.deleteOne({ _id: stage._id })
      const cardsWithStage = await Card.find({stageId : stage._id})
      if (cardsWithStage.length){
      await Card.updateMany(
        { stageId: stage._id },
        {
          $set: {
            'stageId': newStage._id
          }
        },
        { new: true }
      )}
      return {
        takenSpace :resCompany.takenSpace 
      }
    } catch (e) {
      console.log(`delete satge servece`, e)
    }
  }
}

export const stageService = new StageService()
