import { Company } from '../models/company.js'
import { NotSuccesCart } from '../models/notSuccessCart.js'
import { User } from '../models/user.js'
import { CommandOfSale } from '../models/commandOfSale.js'
import { Card } from '../models/card.js'

class NotSuccessCardService {
  async create ({ status, title, price, caption, userId, cardId }) {
    const nsCard = await NotSuccesCart.create({ status, title, price, caption, userId })
    const user = await User.findById(userId).lean()
    const card = await Card.findById(cardId).lean()

    Promise.all(
      [
        Card.findOneAndUpdate(
          { _id: card._id },
          {
            $set: {
              'status': 'refusual'
            }
          },
          { mew: true }
        ),
        User.findOneAndUpdate(
          { _id: user._id },
          {
            $addToSet: {
              'refusals': nsCard
            }
          },
          { new: true }
        ),
        Company.findOneAndUpdate(
          { _id: user.companyId },
          {
            $addToSet: {
              'refusals': nsCard
            }
          },
          { new: true }
        ),
        CommandOfSale.findOneAndUpdate(
          { _id: user.comandId },
          {
            $addToSet: {
              'refusals': nsCard
            }
          },
          { mew: true }
        )
      ]
    )

    // Promise.all(
    //     [
    //         User.findOneAndUpdate(
    //             { _id: user._id },
    //             {
    //                 $addToSet: {
    //                     'refusals': nsCard
    //                 },
    //                 $set: {
    //                     'cards.$[cardid].status': 'refusual'
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
    //                     'users.$[userid].refusals': nsCard,
    //                     'comandOfSale.$[comandid].users.$[userid].refusals': nsCard,
    //                     'refusals': nsCard,
    //                 },
    //                 $set: {
    //                     'cards.$[cardid].status': 'refusual',
    //                     'users.$[userid].cards.$[cardid].status': 'refusual',
    //                     'comandOfSale.$[comandid].cards.$[cardid].status': 'refusual',
    //                     'comandOfSale.$[comandid].users.$[userid].cards.$[cardid].status': 'refusual',
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
    //                     'refusals': nsCard,
    //                     'users.$[userid].refusals': nsCard
    //                 },
    //                 $set: {
    //                     'cards.$[cardid].status': 'refusual',
    //                     'users.$[userid].cards.$[cardid].status': 'refusual'
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
    //                     'status': 'refusual'
    //                 }
    //             },
    //             { new: true }
    //         )

    //     ]
    // )

    // const succesCarts = await NotSuccesCart.find({ userId: userId })
    const nsuccesCarts = await Company.findById({ _id: user.companyId })
      .populate('refusals')
      .then(cmp => cmp.refusals)
    return nsuccesCarts
  }
  async get ({ userId }) {
    // const succesCarts = await NotSuccesCart.find({ userId: userId })
    const user = await User.findById(userId)
    const nsuccesCarts = await Company.findById({ _id: user.companyId })
      .populate('refusals')
      .then(cmp => cmp.refusals)
    return nsuccesCarts
  }
}

export const notSuccessCardService = new NotSuccessCardService()
