export default class UserToken {
  id
  fio
  role
  isActivated
  company
  constructor(model) {
      this.id = model._id
      this.fio = model.fio
      this.role = model.role
      this.isActivated = model.isActivated
      this.company = model.company
  }
}
