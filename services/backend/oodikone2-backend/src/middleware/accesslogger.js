const morgan = require('morgan')

const accessLogger = morgan((tokens, req, res) => {
  const fields = ['method', 'url', 'status', 'response-time', 'remote-addr', 'remote-user', 'user-agent', 'referrer']
  const meta = req.decodedToken
  fields.forEach(field => meta[field] = tokens[field](req, res))
})

module.exports = accessLogger