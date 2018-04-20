const morgan = require('morgan')
const logger = require('./util/logger')

const courses = require('./routes/courses')
const department = require('./routes/department')
const students = require('./routes/students')
const population = require('./routes/population')
const login = require('./routes/login')
const users = require('./routes/users')

const auth = require('./middleware/auth')

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
  logger.info(message, meta)
})

module.exports = (app, url) => {
  app.use(url, login)
  app.use(auth.checkAuth, accessLogger)
  app.use(url, courses)
  app.use(url, department)
  app.use(url, students)
  app.use(url, population)
  app.use(auth.checkAdminAuth)
  app.use(url, users)
}