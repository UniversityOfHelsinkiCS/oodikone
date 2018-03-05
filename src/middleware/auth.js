const jwt = require('jsonwebtoken')
const conf = require('../conf-backend')

const uidHeaderName = 'eduPersonPrincipalName'
const isShibboUser = (userId, uidHeader) => userId === uidHeader.split('@')[0]

module.exports.checkAuth = async (req, res, next) => {
  console.log('checkAuth beginning')

  const token = req.headers['x-access-token']
  const uidHeader = req.headers[uidHeaderName] || req.headers[uidHeaderName.toLowerCase()]
  console.log('checkAuth')
  if (token) {
    jwt.verify(token, conf.TOKEN_SECRET, (err, decoded) => {
      console.log('Jwt verification done')
      if (!err && isShibboUser(decoded.userId, uidHeader)) {
        console.log('Jwt verification approved')
        req.decodedToken = decoded // everything is good, save to request for use in other routes
        next()
      } else {
        console.log('Jwt verification ERROR')
        res.status(403).end()
      }
    })
  } else {
    res.status(403).end()
  }
}

