import { mailService } from "../middleware/mail.js"
import { Company } from "../models/company.js"
import {User} from "../models/user.js"

class CheckDate {
  async check(){
    const users = await User.find({})
    for(let user of users){
      const company = await Company.findById(user.companyId)
      const now = new Date()
      const tommorow = new Date()
      tommorow.setTime(tommorow.getTime() + 24*60*60*1000)
      const payment = new Date(company.paymentDate)
      payment.setTime(payment.getTime() - 5 * 24*60*60*1000)
      if(payment >= now && payment < tommorow) {
        mailService.sendTarifTime(process.env.MAIL_USER,5,user.email)
      }
      payment.setTime(payment.getTime() + 2 * 24*60*60*1000)
      if(payment >= now && payment < tommorow) {
        mailService.sendTarifTime(process.env.MAIL_USER,3,user.email)
      }
      payment.setTime(payment.getTime() + 4 * 24*60*60*1000)
      if(payment >= now && payment < tommorow) {
        mailService.sendTarifTime(process.env.MAIL_USER,1,user.email)
      }
    }
    return
  }
}

export const checkDate = new CheckDate()