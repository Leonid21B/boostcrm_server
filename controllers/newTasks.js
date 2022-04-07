import { newTaskService } from '../middleware/newTask.js'

class NewTaskController {
  async createTask (req, res) {
    try {
      const newTask = await newTaskService.createTask(req.body)
      return res.json(newTask)
    } catch (e) {
      console.log(`newTask controller create`, e)
    }
  }
  async getTasks (req, res) {
    try {
      const tasks = await newTaskService.getTasks(req.params)

      return res.json(tasks)
    } catch (e) {
    }
  }
  async getCurrentCartTasks (req, res) {
    try {
      const tasks = await newTaskService.getCurrentCartTasks(req.params)
      return res.json(tasks)
    } catch (e) {
    }
  }

  async getOne ({ id }) {
    try {
    } catch (e) {
    }
  }

  async delete (req, res) {
    try {
      const tasks = await newTaskService.deleteTask(req.params)
      return res.json(tasks)
    } catch (e) {
    }
  }

  async update (req, res) {
    try {
      const tasks = await newTaskService.updateTask(req.body)
      return res.json(tasks)
    } catch (e) {
    }
  }

  async close (req, res) {
    try {
      const card = await newTaskService.closeTask(req.params)
      return res.json(card)
    } catch (e) {
    }
  }
}

export default NewTaskController
