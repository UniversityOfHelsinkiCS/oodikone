const morgan = require('morgan')
const usageService = require('../services/usageService')
const logger = require('../util/logger')

// So this appears to be a hack to get neatly formatted stats like response-time etc. from morgan
// without actually using morgan what it's used for (LOGGING REQUESTS!).
// Return undefined from here so that stuff isn't printed to console
// so don't e.g. make it into an async function or it'll print [object Promise] on every request
const accessLogger = morgan((tokens, req, res) => {
  const fields = ['method', 'url', 'status', 'response-time', 'remote-addr', 'remote-user', 'user-agent', 'referrer']
  const meta = req.decodedToken
  fields.forEach(field => (meta[field] = tokens[field](req, res)))

  const message = [
    req.decodedToken.name,
    ':',
    tokens['method'](req, res),
    tokens['url'](req, res),
    tokens['status'](req, res),
    '-',
    tokens['response-time'](req, res),
    'ms'
  ].join(' ')

  usageService.log(message, meta).catch(e => {
    logger.error('Failed to save usage stats!', e)
  })
})

module.exports = accessLogger
