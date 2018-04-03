const jwt = require('jsonwebtoken')
const conf = require('../conf-backend')

const isShibboUser = (userId, uidHeader) => userId === uidHeader

const checkAuth = async (req, res, next) => {
  const token = req.headers['x-access-token']
  const uid = req.headers['uid']
  if (token) {
    jwt.verify(token, conf.TOKEN_SECRET, (err, decoded) => {
      if (err) {
        res.json(err).status(403).end()
      } else if (isShibboUser(decoded.userId, uid)) {
        if (decoded.enabled) {
          req.decodedToken = decoded
          next()
        } else {
          res.json({ error: 'User is not enabled' }).status(403).end()
        }
      } else {
        res.json({ error: 'User shibboleth id and token id did not match' }).status(403).end()
      }
    })
  } else {
    res.json({ error: 'No token in headers' }).status(403).end()
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
