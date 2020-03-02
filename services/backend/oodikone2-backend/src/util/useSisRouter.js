const { dbConnections } = require('../databaseV2/connection')

module.exports = (sisRouter, defaultRouter) => (req, res, next) => {
  if (req.headers['x-sis'] === 'true' && dbConnections.established) {
    return sisRouter(req, res, () => {
      return defaultRouter(req, res, next)
    })
  } else {
    return defaultRouter(req, res, next)
  }
}
