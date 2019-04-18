const morgan = require('morgan')
const UsageService = require('../services/usageService')

const accessLogger = morgan((tokens, req, res) => {
  const fields = ['method', 'url', 'status', 'response-time', 'remote-addr', 'remote-user', 'user-agent', 'referrer']
  const message = [
    req.decodedToken.name, ':',
    tokens['method'](req, res),
    tokens['url'](req, res),
    tokens['status'](req, res),
    '-',
    tokens['response-time'](req, res), 'ms'
  ].join(' ')
  const meta = req.decodedToken
  fields.forEach(field => meta[field] = tokens[field](req, res))
  UsageService.log(message, meta).catch(console.log)
 
})

module.exports = accessLogger