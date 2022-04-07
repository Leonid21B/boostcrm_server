import { Card } from '../models/card.js'
import { CommandOfSale } from '../models/commandOfSale.js'
import { Company } from '../models/company.js'
import { SuccesCart } from '../models/successCard.js'
import { User } from '../models/user.js'

class SuccessCardService {
  async create ({ status, title, price, userId, cardId }) {
    const sCard = await SuccesCart.create({ status, title, price, userId })
    const user = await User.findById(userId).lean()
    const card = await Card.findById(cardId).lean()

    Promise.all(
      [
        Card.findOneAndUpdate(
          { _id: card._id },
          {
            $set: {
              'status': 'success'
            }
          },
          { new: true }
        ),
        User.findOneAndUpdate(
          { _id: user._id },
          {
            $addToSet: {
              'successes': sCard
            }
          },
          { new: true }
        ),
        Company.findOneAndUpdate(
          { _id: user.companyId },
          {
            $addToSet: {
              'successes': sCard
            }
          },
          { new: true }
        ),
        CommandOfSale.findOneAndUpdate(
          { _id: user.comandId },
          {
            $addToSet: {
              'successes': sCard
            }
          },
          { new: true }
        )
      ]
    )

    // Promise.all(
    //     [

    //         User.findOneAndUpdate(
    //             { _id: user._id },
    //             {
    //                 $addToSet: {
    //                     'successes': sCard
    //                 },
    //                 $set: {
    //                     'cards.$[cardid].status': 'success'
    //                 }
    //             },
    //             {
    //                 arrayFilters: [
    //                     { 'cardid._id': card._id }
    //                 ],
    //                 new: true
    //             }
    //         ),
    //         Company.findOneAndUpdate(
    //             { _id: user.companyId },
    //             {
    //                 $addToSet: {
    //                     'users.$[userid].successes': sCard,
    //                     'comandOfSale.$[comandid].users.$[userid].successes': sCard,
    //                     'successes': sCard,
    //                 },
    //                 $set: {
    //                     'cards.$[cardid].status': 'success',
    //                     'users.$[userid].cards.$[cardid].status': 'success',
    //                     'comandOfSale.$[comandid].cards.$[cardid].status': 'success',
    //                     'comandOfSale.$[comandid].users.$[userid].cards.$[cardid].status': 'success',
    //                 }
    //             },
    //             {
    //                 arrayFilters: [
    //                     { 'userid.id': user._id },
    //                     { 'cardid._id': card._id },
    //                     { 'comandid._id': user.comandId }
    //                 ],
    //                 new: true
    //             }
    //         ),
    //         CommandOfSale.findOneAndUpdate(
    //             { _id: user.comandId },
    //             {
    //                 $addToSet: {
    //                     'successes': sCard,
    //                     'users.$[userid].successes': sCard
    //                 },
    //                 $set: {
    //                     'cards.$[cardid].status': 'success',
    //                     'users.$[userid].cards.$[cardid].status': 'success'
    //                 }
    //             },
    //             {
    //                 arrayFilters: [
    //                     { 'userid.id': user._id },
    //                     { 'cardid._id': card._id },
    //                 ],
    //                 new: true
    //             }
    //         ),
    //         Card.findOneAndUpdate(
    //             { _id: card._id },
    //             {
    //                 $set: {
    //                     'status': 'success'
    //                 }
    //             },
    //             { new: true }
    //         )

    //     ]
    // )

    // const succesCarts = await SuccesCart.find({ userId: userId })
    const succesCarts = await Company.findById({ _id: user.companyId }).lean().then(cmp => cmp.successes)
    return succesCarts
  }
  async get ({ userId }) {
    // const succesCarts = await SuccesCart.find({ userId: userId })
    const user = await User.findById(userId).lean()
    const succesCarts = await Company.findById({ _id: user.companyId }).then(cmp => cmp.successes)
    return succesCarts
  }
}

export const successCardService = new SuccessCardService()
