const express = require('express')
require('express-async-errors')
const { scheduleMeta, scheduleStudents } = require('./scheduler')
const { SECRET_TOKEN } = require('./config')

const bakeMessage = res => (message = '', status = 200) => {
  res.status(status).json({ message })
}

const message = (_, res, next) => {
  res.locals.msg = bakeMessage(res)
  next()
}

const auth = (req, res, next) => {
  if (req.query.token === SECRET_TOKEN) {
    return next()
  }

  res.locals.msg('Token missing or invalid', 403)
}

const errorBoundary = (err, _, res, next) => {
  console.error(err.stack)
  res.locals.msg('Internal server error', 500)
  next(err)
}

const app = express()
app.use(express.json())
app.use(message)
app.use(auth)

app.get('/v1/meta', async (_, res) => {
  await scheduleMeta()
  res.locals.msg('Scheduled meta')
})

app.get('/v1/students', async (_, res) => {
  await scheduleStudents()
  res.locals.msg('Scheduled students')
})

app.use(errorBoundary)

const PORT = 8082
const startServer = () => {
  app.listen(PORT, () => {
    console.log(`Scheduler server listening on port ${PORT}`)
  })
}

module.exports = {
  startServer
}
