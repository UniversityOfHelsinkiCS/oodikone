const morgan = require('morgan')
const logger = require('./util/logger')

const log = require('./routes/log')
const courses = require('./routes/courses')
const department = require('./routes/department')
const students = require('./routes/students')
const population = require('./routes/population')
const login = require('./routes/login')
const users = require('./routes/users')
const elementdetails = require('./routes/elementdetails')
const auth = require('./middleware/auth')
const teachers = require('./routes/teachers')
const usage = require('./routes/usage')
const providers = require('./routes/providers')
const semesters = require('./routes/semesters')
const oodilearn = require('./routes/oodilearn')
const courseGroups = require('./routes/courseGroups')
const mandatoryCourses = require('./routes/mandatorycourses')
const ping = require('./routes/ping')


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
  app.use(url, log)
  app.use(url, login)
  app.use(url, ping)
  app.use(auth.checkAuth, accessLogger)
  app.use(url, elementdetails)
  app.use(url, courses)
  app.use(url, department)
  app.use(url, students)
  app.use(url, population)
  app.use(url, providers)
  app.use(url, semesters)
  app.use(`${url}/teachers`, auth.roles(['teachers']), teachers)
  app.use(`${url}/users`, auth.roles(['users']), users)
  app.use(`${url}/usage`, auth.roles(['usage']), usage)
  app.use(`${url}/oodilearn`, auth.roles(['oodilearn']), oodilearn)
  app.use(`${url}/course-groups`, auth.roles(['coursegroups']), courseGroups)
  app.use(`${url}/mandatory_courses`, auth.roles(['studyprogramme']), mandatoryCourses)
}