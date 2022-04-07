import { newFieldService } from '../middleware/newField.js'

class NewFieldController {
  async create (req, res) {
    try {
      const field = await newFieldService.create(req.body)
      return res.json(field)
    } catch (e) {
      console.log(`e`, e)
    }
  }
  async get (req, res) {
    try {
      const fields = await newFieldService.get(req.params)
      return res.json(fields)
    } catch (e) {
      console.log(`e`, e)
    }
  }

  async update (req, res) {
    try {
      const fields = await newFieldService.update(req.body)
      return res.json(fields)
    } catch (e) {
      console.log(`e`, e)
    }
  }
}

export default NewFieldController
