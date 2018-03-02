const jwt = require('jsonwebtoken')
const conf = require('../conf-backend')

module.exports.checkAuth = async (req, res, next) => {
  const token = req.headers['x-access-token']
  if (token) {
    jwt.verify(token, conf.TOKEN_SECRET, (err, decoded) => {
      if (!err && // If no error
        (decoded.userId === req.headers['eduPersonPrincipalName'].split('@')[0] || // And userId or
          process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test')) { // environment is okay, then
        req.decodedToken = decoded // everything is good, save to request for use in other routes
        return next()
      }
    })
  }
  return res.status(403).end()
}