import jwt from 'jsonwebtoken'
import { Token } from '../models/token.js'

class TokenService {
  generateToken (payload) {
    const accsessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_KEY, { expiresIn: '15m' })
    const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_KEY, { expiresIn: '1h' })

    return { accsessToken, refreshToken }
  }

  validateAccessToken (token) {
    try {
      const userToken = jwt.verify(token, process.env.ACCESS_TOKEN_KEY)
      return userToken
    } catch (error) {
      console.log(`error validateAccessToken `, error)
      return false
    }
  }

  validateRefreshToken (token) {
    try {
      const userToken = jwt.verify(token, process.env.REFRESH_TOKEN_KEY)
      return userToken
    } catch (error) {
      console.log(`error validateRefreshToken `, error)
    }
  }

  async searchToken (token) {
    const userToken = await Token.findOne({refreshToken: token})
    return userToken
  }

  async saveToken (userId, refToken) {
    const hasToken = await Token.findOne({user: userId})
    if (hasToken) {
      hasToken.refreshToken = refToken
      return hasToken.save()
    }
    const token = await Token.create({user: userId, refreshToken: refToken})
    return token
  }

  async remove (token) {
    const userToken = await Token.deleteOne({refToken: token})
    return userToken
  }
}

export const tokenService = new TokenService()
