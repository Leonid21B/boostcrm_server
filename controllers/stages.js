import { stageService } from '../middleware/stages.js'

class StageControler {
  async createStage (req, res) {
    try {
      const stage = await stageService.create(req.body)
      return res.json(stage)
    } catch (e) {
      console.log(`create stage`, e)
    }
  }

  async getStages (req, res) {
    try {
      const stages = await stageService.getAll(req.params)
      return res.json(stages)
    } catch (e) {
      console.log(`get all stages`, e)
    }
  }

  async getStage (req, res) {
    try {
      const stages = await stageService.getOne(req.params)
      console.log(`stages`, stages)
      return res.json(stages)
    } catch (e) {
      console.log(`get one stage`, e)
    }
  }

  async updateStage (req, res) {
    try {
      const stages = await stageService.update(req.body)
      // console.log(`stages`, stages)
      return res.json(stages)
    } catch (e) {
      console.log(`get one stage`, e)
    }
  }

  async deleteStage (req, res) {
    try {
      const stages = await stageService.delete(req.params)
      return res.json(stages)
    } catch (e) {
      console.log(`delete stage`, e)
    }
  }
}

export default StageControler
