const jwt = require('jsonwebtoken')
const conf = require('../conf-backend')

module.exports.checkAuth = async (req, res, next) => {

  const token = req.headers['x-access-token']
  if (token) {
    jwt.verify(token, conf.TOKEN_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: 'Failed to authenticate token.' }).end()
      } else {
        // if everything is good, save to request for use in other routes
        req.decodedToken = decoded
        next()
      }
    })
  } else {
    return res.status(403).end()
  }
}