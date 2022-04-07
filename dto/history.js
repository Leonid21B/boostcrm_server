export default class History{
  id
  name
  title
  date
  helper
  constructor(model){
      this.id = model.id
      this.name = model.name
      this.title = model.title
      this.date = model.date
      this.helper = model.helper
  }
}
