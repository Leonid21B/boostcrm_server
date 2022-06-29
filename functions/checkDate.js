import { mailService } from "../middleware/mail.js"
import { Card } from "../models/card.js"
import { Client } from "../models/client.js"
import { CommandOfSale } from "../models/commandOfSale.js"
import { Company } from "../models/company.js"
import { newTask } from "../models/newTask.js"
import { Stage } from "../models/stage.js"
import {User} from "../models/user.js"

class CheckDate {
  async checkStages(){
    const user = await User.find({email:'lyonya23@gmail.com'})
    const stages = await Stage.find({userId:user._id})
    console.log(stages)
    return
  }
  async checkProb(){
    try{
      const companies = await Company.find()
      console.log(companies)
      let filtCompanies = companies.filter(it => {
        
        const dateAdd = new Date(it.createdAt)
        const dateNow = new Date()
        const datePaym = new Date(it.paymentDate)
        console.log(dateAdd)
        console.log(datePaym)
        console.log(datePaym.getTime() - dateAdd.getTime())
        console.log(1000 * 60 * 60 * 11 * 24)
        if(datePaym.getTime() - dateAdd.getTime() <= 1000 * 60 * 60 * 11 * 24  && datePaym.getTime() - dateNow.getTime() < 0){
          return true
        }else{
          return false
        }
      })
      console.log(filtCompanies) 
      for(let it in filtCompanies){
        const user = await User.findOne({_id:filtCompanies[it].userId,role:'admin'})
        if(user.email == 'lyonya23@gmail.com'){
          console.log('remove!!')
          console.log('remove!!')
          console.log('remove!!')
          console.log('remove!!')
          console.log('remove!!')
        }
        await Company.deleteOne({_id:filtCompanies[it]._id})
        await Client.deleteMany({userId:user._id})
        await Card.deleteMany({userId:user._id})
        await CommandOfSale.deleteMany({userId:user._id})
        await newTask.deleteMany({userId:user._id})
        await Stage.deleteMany({companyId : filtCompanies[it]._id})
        await User.deleteMany({companyId:filtCompanies[it]._id})
        console.log(filtCompanies[it]._id, 'deleted')
      }
    }catch(err){
      console.log(err)
    }
  }
  async check(){
    try{
    const users = await User.find({})
    for(let user of users){
      const company = await Company.findById(user.companyId)
      if(!company){
        continue
      }
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
    return}
    catch(err){
      console.log(err)
    }
  }
}

export const checkDate = new CheckDate()