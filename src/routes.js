const courses = require('./routes/courses')
const department = require('./routes/department')
const students = require('./routes/students')
const tags = require('./routes/tags')
const population = require('./routes/population')


module.exports = (app, url) => {
  app.use(url, courses)
  app.use(url, department)
  app.use(url, students)
  app.use(url, tags)
  app.use(url, population)
}