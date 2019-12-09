const Raven = require('raven')

const sentryUserIdMiddleware = (req, res, next) => {
  if (req.decodedToken && req.decodedToken.userId) {
    Raven.setContext({
      user: { id: req.decodedToken.userId }
    })
  }
  next()
}

module.exports = sentryUserIdMiddleware
