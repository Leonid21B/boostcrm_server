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
    space: obj.space,
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
}

export default new CompaniesController()