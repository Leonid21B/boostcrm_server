import { Company } from "../models/company.js";
import { User } from "../models/user.js";

const userDto = (user,company) => {
  return{
    id: user.id,
    company:{
      id: company.id,
      takenSpace:company.takenSpace,
      paymentDate:company.paymentDate,
    },
    email:user.email,
    fio: user.fio
  }
}
const toUP = (str) => {
  const low = 'abcdefghijklmnopqrstuvwxyz'
  const up = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let newstr = ''
  for(let i = 0; i < str.length; i++){
    if(low.indexOf(str[i]) != -1){
      newstr += up[low.indexOf(str[i])]
    }else{
      newstr += str[i]
    }
  }
  return newstr
}


const addAdmin = (obj,value) => {
  return {
    id: obj.id,
    admin: value,
    paymentDate: obj.paymentDate,
    space: obj.space / 1024 > 1 ? obj.space /1024 : obj.space ,
    takenSpace: obj.takenSpace,
    createdAt: obj.createdAt,
  }
}

class CompaniesController{
  async getCompanies(req,res,next){
    try{
      const limit = req.params.limit
      const page = req.params.page
      const companiesAll = await Company.find({})
      const sortedByDate = companiesAll.sort((a,b) => {a.createdAt - b.createdAt})
      const sortedByClients  = companiesAll.sort((a,b) => {a.clients.length - b.clients.length})
      let resDate = [...sortedByDate.slice((page-1) * limit,page * limit)]
      for (let it in resDate){
        const user = await User.findOne({companyId:resDate[it].id, role:'admin'})
        resDate[it] = addAdmin(resDate[it], user)
      }
      let resClients = [...sortedByClients.slice((page-1) * limit,page * limit)]
      for (let it in resClients){
        const user = await User.findOne({companyId:resClients[it].id, role:'admin'})
        resClients[it] = addAdmin(resClients[it], user)
        console.log(resClients)
      }
      return res.json({
        resDate,
        resClients
      })
    }catch(err){
      console.log(err)
    }
  }
  async companySearch(req,res,next){
    try{
      let searchStr = req.body.searchStr
      console.log(req.body)
      searchStr =  toUP(searchStr)
      console.log(searchStr)
      const users = await User.find({})
      let resUsers = users.filter((item) => {
        if(toUP(item.email).indexOf(searchStr) != -1) {
          return true
        }else{
          return false
        }
      })
      let newUsers = []
      for(let it of resUsers){
        console.log(it.companyId)
        const company = await Company.findOne({_id: it.companyId})
        console.log(company.id)
        newUsers.push(userDto(it,{id:company.id,takenSpace:company.takenSpace,paymentDate:company.paymentDate}))
      }
      console.log(resUsers)
      return res.json({
        resUsers:newUsers
      })
    }catch(err){
      console.log(err)
      return res.json({
        resUsers: []
      })
    }
  }
  async getCompany(req,res){
    try{
      console.log(req.params.id)
      let company = await Company.findById(req.params.id)
      const users = await User.find({companyId:company._id})
      company.users = users
      console.log(company)
      return res.json({
        company
      })
    }catch(err){
      console.log(err)
      return res.json({company:null})
    }
  }
  async changeAdmin(req,res){
    try{
      const user = await User.findById(req.params.userId)
      const company = await Company.find({_id:user.companyId})
      console.log(company[0])
      console.log(company[0].id)
      const admin = await User.find({companyId:company[0]._id, role:'admin'})
      await User.findByIdAndUpdate(req.params.userId,{role:'admin'},{new:true})
      await User.findByIdAndUpdate(admin[0].id,{role:'user'},{new:true})
      return res.json(true)
    }catch(err){
      console.log(err)
      return res.json(false)
    }
  }
  async deleteUser(req,res){
    try{
      const user = await User.findById(req.params.userId)
      if(user && user?.role == 'user'){
        await User.findByIdAndDelete(req.params.userId)
        let companyUsers = await Company.findOne({_id:user.companyId})
        companyUsers = companyUsers.users.filter(item => item != req.params.userId)
        await Company.findOneAndUpdate({_id:user.companyId},{users:companyUsers})
        return res.json(true)
      }
      return res.json(false)
    }catch(err){
      console.log(err)
      return res.json(false) 
    }
  }
  async changePayDate(req,res) {
    try{
      const date = req.body.date
      const companyId = req.body.companyId
      await Company.findByIdAndUpdate(companyId, {paymentDate:date})
      return res.json(true)
    }catch(err) {
      console.log(err)
      return res.json(false)
    }
  }

  async changePayDate(req,res) {
    try{
      const date = req.body.date
      const companyId = req.body.companyId
      await Company.findByIdAndUpdate(companyId, {paymentDate:date})
      return res.json(true)
    }catch(err) {
      console.log(err)
      return res.json(false)
    }
  }
  async changeSpace(req,res) {
    try{
      console.log(req.body.companyId,req.body.newSpace)
      const company = await Company.findByIdAndUpdate(req.body.companyId,{space:req.body.newSpace},{new:true})
      console.log(company)
      return res.json(true)
    }catch(err){
      console.log(err)
      return res.json(false)
    }
  }
  async getAll(req,res){
    try{
      const companies = await Company.find({})
      let numb = companies.length
      let numbCurrent  = companies.filter(it => new Date(it.paymentDate) > new Date()).length
      let allTakenSpace = 0
      let allBuySpace = 0
      console.log(companies)
      for (let comp in companies){
        allTakenSpace += companies[comp].takenSpace
        allBuySpace += companies[comp].space
      }
      return res.json({
        numb,
        allBuySpace,
        allTakenSpace,
        numbCurrent,
      })
    }catch(err){
      console.log(err)
    }
  }
}

export default new CompaniesController()