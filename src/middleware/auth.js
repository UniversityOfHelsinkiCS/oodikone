const jwt = require('jsonwebtoken')
const conf = require('../conf-backend')

module.exports.checkAuth = async (req, res, next) => {
  const token = req.headers['x-access-token']
  if (token) {
    await jwt.verify(token, conf.TOKEN_SECRET, (err, decoded) => {
      if (!err && // If no error
        (process.env.NODE_ENV === 'dev' || process.env.NODE_ENV === 'test') || // environment is okay or
        decoded.userId === req.headers['eduPersonPrincipalName'].split('@')[0]) // userId is okay, then
      {
        req.decodedToken = decoded // everything is good, save to request for use in other routes
        next()
      } else {
        res.status(403).end()
      }
    })
  } else {
    res.status(403).end()
  }
}