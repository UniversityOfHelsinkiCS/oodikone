const jwt = require('jsonwebtoken')
const conf = require('../conf-backend')
const blacklist = require('../services/blacklist')
const { ACCESS_TOKEN_HEADER_KEY } = require('../conf-backend')

const isShibboUser = (userId, uidHeader) => userId === uidHeader

const checkAuth = async (req, res, next) => {
  const token = req.headers[ACCESS_TOKEN_HEADER_KEY]
  const uid = req.headers['uid']
  if (token) {
    jwt.verify(token, conf.TOKEN_SECRET, async (err, decoded) => {
      if (err) {
        res.status(403).json(err)
      } else if (isShibboUser(decoded.userId, uid)) {
        if (decoded.enabled) {
          req.decodedToken = decoded
          next()
        } else {
          res.status(403).json({ error: 'User is not enabled' })
        }
      } else {
        res.status(403).json({ error: 'User shibboleth id and token id did not match' })
      }
    })
  } else {
    res.status(403).json({ error: 'No token in headers' })
  }
}

const roles = requiredRoles => (req, res, next) => {
  if (req.decodedToken && req.decodedToken.roles != null) {
    const roles = req.decodedToken.roles.map(r => r.group_code)
    console.log(`Request has roles: ${roles}`)
    if (requiredRoles.every(r => roles.indexOf(r) >= 0) || roles.includes('admin')) {
      console.log(`authorized for ${requiredRoles}`)
      next()
      return
    }
  }
  console.log(`missing required roles ${requiredRoles}`)
  res.status(403).json({ error: 'missing required roles' })
}

const checkTokenBlacklisting = async (req, res, next) => {
  const token = req.headers[ACCESS_TOKEN_HEADER_KEY]
  const isBlacklisted = await blacklist.isTokenBlacklisted(token)
  if (isBlacklisted) {
    res.status(401).json({ error: 'Token needs to be refreshed' })
  } else {
    next()
  }
}

module.exports = {
  checkAuth, roles, checkTokenBlacklisting
}
