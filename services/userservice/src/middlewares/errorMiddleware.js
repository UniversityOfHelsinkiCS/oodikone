const Sentry = require('@sentry/node')
const { ApplicationError } = require('../util/customErrors')

const errorHandler = (error, req, res, next) => {
  console.error(`${error.message} ${error.name} ${error.stack}`)
  console.error(`Body of failing request: ${JSON.stringify(req.body)}`)

  // enrich with user details from req body
  Sentry.captureException({
    ...error,
    reqBody: req.body,
  })

  if (res.headersSent) {
    return next(error)
  }

  const normalizedError = error instanceof ApplicationError ? error : new ApplicationError(error.message)

  return res.status(normalizedError.status).json(normalizedError)
}

module.exports = errorHandler
