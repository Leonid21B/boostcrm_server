import { tokenService } from './tokens.js'

export default function (req, res, next) {
  try {
    const autorizHeader = req.headers.authorization

    if (!autorizHeader) {
      // return {msg:"autorizHeader not exists"}
      throw new Error('autorizHeader not exists')
    }

    const accessToken = autorizHeader.split(' ')[1]
    if (!accessToken) {
      // return {msg:"accessToken not exists"}
      throw new Error('accessToken not exists"')
    }

    const userData = tokenService.validateAccessToken(accessToken)

    if (!userData) {
      // return {msg:'accessToken not valid '}
      throw new Error('accessToken not valid')
    }
    req.user = userData
    next()
  } catch (error) {
    return {msg: 'user not auth'}
  }
}
