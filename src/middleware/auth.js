const jwt = require('jsonwebtoken')
const conf = require('../conf-backend')

const isShibboUser = (userId, uidHeader) => userId === uidHeader

const checkAuth = async (req, res, next) => {
  console.log('checkAuth beginning')

  const token = req.headers['x-access-token']
  const uid = req.headers['uid']
  console.log('checkAuth')
  if (token) {
    jwt.verify(token, conf.TOKEN_SECRET, (err, decoded) => {
      console.log('Jwt verification done')
      console.log('err: ', err)
      console.log(decoded)
      console.log(uid, ' should equal ', decoded.userId)
      if (!err && isShibboUser(decoded.userId, uid)) {
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
  if (req.decodedToken.admin) {
    next()
  } else {
    res.status(403).end()
  }
}

module.exports = {
  checkAuth, checkAdminAuth
}
