const jwt = require('jsonwebtoken')
const conf = require('../conf-backend')

const uidHeaderName = 'eduPersonPrincipalName'
const isShibboUser = (userId, uidHeader) => userId === uidHeader.split('@')[0]

module.exports.checkAuth = async (req, res, next) => {
  const token = req.headers['x-access-token']
  const uidHeader = req.headers[uidHeaderName] || req.headers[uidHeaderName.toLowerCase()]
  if (token) {
    jwt.verify(token, conf.TOKEN_SECRET, (err, decoded) => {
      if (!err && isShibboUser(decoded.userId, uidHeader)) {
        req.decodedToken = decoded // everything is good, save to request for use in other routes
        return next()
      }
      return res.status(403).end()
    }).then(() => {})
  }
  return res.status(403).end()
}

