const courses = require('./routes/courses')
const department = require('./routes/department')
const students = require('./routes/students')
const tags = require('./routes/tags')
const population = require('./routes/population')
const teacher = require('./routes/teacher')
const login = require('./routes/login')
const users = require('./routes/users')

const auth = require('./middleware/auth')

module.exports = (app, url) => {
  app.use(url, login)
  app.use(auth.checkAuth)
  app.use(url, courses)
  app.use(url, department)
  app.use(url, students)
  app.use(url, tags)
  app.use(url, population)
  app.use(url, teacher)
  app.use(url, auth.checkAdminAuth)
  app.use(url, users)
}