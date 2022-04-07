import { cardService } from '../middleware/cards.js'

class CardControler {
  async createCart (req, res) {
    try {
      const cart = await cardService.create(req.body)
      return res.json(cart)
    } catch (e) {
      console.log(`e`, e)
    }
  }

  async getCarts (req, res) {
    try {
      const cart = await cardService.getAll(req.params)
      return res.json(cart)
    } catch (e) {
      console.log(`e`, e)
    }
  }

  async getCart (req, res) {
    try {
      const cart = await cardService.getOne(req.params)
      return res.json(cart)
    } catch (e) {
      console.log(`e`, e)
    }
  }

  async getCardHistory (req, res) {
    try {
      const history = await cardService.getCardHistory(req.params)
      return res.json(history)
    } catch (e) {
      console.log(`e`, e)
    }
  }

  async createCardComment (req, res) {
    try {
      const comment = await cardService.createCardComment(req.body)
      return res.json(comment)
    } catch (e) {
      console.log(`e`, e)
    }
  }

  async deleteCart (req, res) {
    try {
      const cart = await cardService.delete(req.params)
      return res.json(cart)
    } catch (e) {
      console.log(`e`, e)
    }
  }

  async updateCart (req, res) {
    try {
      const updatedCart = await cardService.update(req.body)
      return res.json(updatedCart)
    } catch (e) {
      console.log(`cart service delete`, e)
    }
  }

  async updateCartStage (req, res) {
    try {
      const updatedCart = await cardService.updateCartStage(req.body)
      return res.json(updatedCart)
    } catch (e) {
      console.log(`cart service delete`, e)
    }
  }

  async updateCartWorker (req, res) {
    try {
      const updatedCart = await cardService.updateCartWorker(req.body)
      return res.json(updatedCart)
    } catch (e) {
      console.log(`cart service delete`, e)
    }
  }
  async updateCardStatus (req, res) {
    try {
      const resp = await cardService.updateCardStatus(req.body)
      return res.json(resp)
    } catch (e) {
      console.log(`cart service delete`, e)
    }
  }

  async updateCardTitle (req, res) {
    try {
      const resp = await cardService.updateCardTitle(req.body)
      return res.json(resp)
    } catch (e) {
      console.log(`cart service delete`, e)
    }
  }

  async uploadFile (req, res) {
    const file = req.files.file
    const { cardId, userId } = req.params

    const resp = await cardService.uploadFile({ file, cardId, userId })
    return res.json(resp)
  }
}

export default CardControler
