const Sentry = require('@sentry/node')

const sentryUserIdMiddleware = (req, res, next) => {
  Sentry.getCurrentHub().configureScope(scope => {
    scope.setUser({
      username: req.decodedToken && req.decodedToken.userId
    })
  })

  next()
}

module.exports = sentryUserIdMiddleware
