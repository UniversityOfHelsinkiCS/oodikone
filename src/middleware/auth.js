const jwt = require('jsonwebtoken')
const conf = require('../conf-backend')

const uidHeaderName = 'eduPersonPrincipalName'
const isShibboUser = (userId, uidHeader) => userId === uidHeader.split('@')[0]

const admin = ['totutotu', 'tktl', 'mluukkai', 'mitiai', 'ttuotila', 'jakousa']

const checkAuth = async (req, res, next) => {
  console.log('checkAuth beginning')

  const token = req.headers['x-access-token']
  const uidHeader = req.headers[uidHeaderName] || req.headers[uidHeaderName.toLowerCase()]
  console.log('uidHeader: ', uidHeader)
  console.log('headers: ', req.headers)
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

const checkAdminAuth = async (req, res, next) => {
  const userId = req.decodedToken.userId
  const user = admin.find(user => userId === user)
  if (user) {
    next()
  } else {
    console.log('User not an admin')
    res.status(403).end()
  }
}

module.exports = {
  checkAuth, checkAdminAuth
}
