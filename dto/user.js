export default class User {
  id
  fio
  role
  tel
  email
  isActivated
  // linkToCarts
  // commandOfSale
  // comandId
  company
  avatar
  companyId
  cards
  tasks
  clients
  successes
  refusals
  comments
  comandId
  createdAt
  constructor(model) {
      this.id = model._id
      this.fio = model.fio
      this.role = model.role
      this.tel = model.tel
      this.email = model.email
      this.isActivated = model.isActivated
      // this.linkToCarts = model.linkToCarts
      // this.commandOfSale = model.commandOfSale
      this.company = model.company
      this.avatar = model.avatar
      this.companyId = model.companyId
      this.cards = model.cards
      this.tasks = model.tasks
      this.clients = model.clients
      this.comandId = model.comandId
      this.comments = model.comments
      this.successes = model.successes
      this.refusals = model.refusals
      this.createdAt = model.createdAt

  }
}
