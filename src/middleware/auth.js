const jwt = require('jsonwebtoken')
const conf = require('../conf-backend')

const isShibboUser = (userId, uidHeader) => userId === uidHeader

const checkAuth = async (req, res, next) => {
  const token = req.headers['x-access-token']
  const uid = req.headers['uid']
  if (token) {
    jwt.verify(token, conf.TOKEN_SECRET, (err, decoded) => {
      if (err) {
        res.status(403).json(err)
      } else if (isShibboUser(decoded.userId, uid)) {
        if (decoded.enabled) {
          req.decodedToken = decoded
          if (decoded.admin && decoded.asuser) {
            req.decodedToken.userId = decoded.asuser
            req.decodedToken.admin = false
            req.decodedToken.czar = false
          }
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

const checkAdminAuth = async (req, res, next) => {
  if (req.decodedToken.admin) {
    next()
  } else {
    res.status(403).json({ error: 'Not authorized' })
  }
}
const roles = requiredRoles => (req, res, next) => {
  const token = req.headers['x-access-token']
  if (token) {
    jwt.verify(token, conf.TOKEN_SECRET, (err, decoded) => {
      const roles = decoded.roles.map(r => r.group_code)
      console.log(`Request has roles: ${roles}`)
      if (requiredRoles.every(r => roles.indexOf(r) >= 0) || decoded.admin) {
        console.log(`authorized for ${requiredRoles}`)
        next()
      } else {
        console.log(`missing required roles ${requiredRoles}`)
      }
    })
  }
}
module.exports = {
  checkAuth, checkAdminAuth, roles
}
