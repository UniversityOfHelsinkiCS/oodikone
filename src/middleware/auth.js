const jwt = require('jsonwebtoken')
const conf = require('../conf-backend')
const UserService = require('../services/userService')

const isShibboUser = (userId, uidHeader) => userId === uidHeader

const checkAuth = async (req, res, next) => {
  const token = req.headers['x-access-token']
  const uid = req.headers['uid']
  if (token) {
    jwt.verify(token, conf.TOKEN_SECRET, async (err, decoded) => {
      if (err) {
        res.status(403).json(err)
      } else if (isShibboUser(decoded.userId, uid)) {
        if (decoded.enabled) {
          req.decodedToken = decoded
          if (decoded.roles.map(r => r.group_code).includes('admin') && decoded.asuser) {
            req.decodedToken.userId = decoded.asuser
            req.decodedToken.roles = await UserService.getRolesFor(decoded.asuser)
            req.decodedToken.rights = Object.values(await UserService.getUserElementDetails(decoded.asuser))
              .map(a => a.code)
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

const roles = requiredRoles => (req, res, next) => {
  const token = req.headers['x-access-token']
  if (token) {
    jwt.verify(token, conf.TOKEN_SECRET, (err, decoded) => {
      const roles = decoded.roles.map(r => r.group_code)
      console.log(`Request has roles: ${roles}`)
      if (requiredRoles.every(r => roles.indexOf(r) >= 0) || roles.includes('admin')) {
        console.log(`authorized for ${requiredRoles}`)
        next()
      } else {
        console.log(`missing required roles ${requiredRoles}`)
      }
    })
  }
}
module.exports = {
  checkAuth, roles
}
