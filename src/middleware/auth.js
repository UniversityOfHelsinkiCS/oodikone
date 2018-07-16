const jwt = require('jsonwebtoken')
const conf = require('../conf-backend')

const isShibboUser = (userId, uidHeader) => userId === uidHeader

const checkAuth = async (req, res, next) => {
  const token = req.headers['x-access-token']
  const uid = req.headers['uid']
  console.log(token, uid)
  if (token) {
    jwt.verify(token, conf.TOKEN_SECRET, (err, decoded) => {
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

const checkAdminAuth = async (req, res, next) => {
  if (req.decodedToken.admin) {
    next()
  } else {
    res.status(403).end()
  }
}

module.exports = {
  checkAuth, checkAdminAuth
}
