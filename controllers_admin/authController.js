import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

const generateJwt = (acc,ref) => {
  const accsessToken = jwt.sign({acc}, process.env.ACCESS_TOKEN_KEY, { expiresIn: '15m' })
  const refreshToken = jwt.sign({ref}, process.env.REFRESH_TOKEN_KEY, { expiresIn: '1h' })
  return { accsessToken, refreshToken }
}

const validCookies = async (acces,refresh) => {
  console.log(acces,refresh)
  const verify_access = jwt.verify(acces,process.env.ACCESS_TOKEN_KEY)
  const verify_refresh = jwt.verify(refresh,process.env.REFRESH_TOKEN_KEY)
  console.log(verify_access)
  console.log(verify_refresh)
  const isAcc = await bcrypt.compare(process.env.SECRET_KEY_FOR_ADMIN,verify_access.acc)
  const isRef = await bcrypt.compare(process.env.SECRET_KEY_FOR_ADMIN,verify_refresh.ref)
  console.log(isAcc)
  console.log(isRef)
  if(!isAcc && !isRef|| verify_access.exp - verify_access.iat <= 0 && verify_refresh.exp - verify_refresh.iat <= 0){
    return 0
  }
  if(!isAcc && isRef || verify_access.exp - verify_access.iat <= 0 && verify_refresh.exp - verify_refresh.iat > 0){
    return 1
  }
  if(isAcc && isRef){
    return 2
  }
  
}

class AuthController {
  async checkAuth(req,res,next){
    try{
      if(!req.cookies['admin_refresh-token'] || !req.cookies['admin_access-token']){
        return res.json(false)
      }
      const access = req.cookies['admin_access-token']
      const refresh = req.cookies['admin_refresh-token']
      const code = await validCookies(access,refresh)
      console.log(code)
      if(code === 0){
        return res.json(false)
      }
      if(code === 1) {
        const access = await bcrypt.hash(process.env.SECRET_KEY_FOR_ADMIN,10)
        const refresh = await bcrypt.hash(process.env.SECRET_KEY_FOR_ADMIN,10)
        const data = generateJwt(access,refresh)
        await res.cookie('admin_access-token',data.accsessToken,{httpOnly:true})
        await res.cookie('admin_refresh-token',data.refreshToken,{httpOnly:true})
        return res.json(true)
      }
      if(code === 2) {
        return res.json(true)
      }

      return res.json(false)
    }catch(err){
      console.log(err)
      console.log(1111)
      res.json(false)
    }
  }
  async login(req,res,next){
    try{
      if(req.body.key === process.env.SECRET_KEY_FOR_ADMIN ){
        const access = await bcrypt.hash(process.env.SECRET_KEY_FOR_ADMIN,10)
        const refresh = await bcrypt.hash(process.env.SECRET_KEY_FOR_ADMIN,10)
              console.log(access)
        console.log(refresh)
        const data = generateJwt(access,refresh)
        await res.cookie('admin_access-token',data.accsessToken,{httpOnly:true})
        await res.cookie('admin_refresh-token',data.refreshToken,{httpOnly:true})
        return res.json(true)
      }else{
        return res.json('Неверный ключ')
    }
  }catch(err){
    console.log(err)
  }
  }
}

export default new AuthController()