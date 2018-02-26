const courses = require('./routes/courses')
const department = require('./routes/department')
const students = require('./routes/students')
const tags = require('./routes/tags')

const auth = require('./middleware/auth')


module.exports = (app, url) => {
  app.use(auth.checkAuth)
  app.use(url, courses)
  app.use(url, department)
  app.use(url, students)
  app.use(url, tags)
}