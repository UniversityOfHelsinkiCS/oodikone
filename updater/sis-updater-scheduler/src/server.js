const express = require('express')
require('express-async-errors')
const { scheduleMeta, scheduleStudents, scheduleProgrammes, scheduleByStudentNumbers } = require('./scheduler')
const { getStructure } = require('./explorer')
const { getCourses } = require('./courseParser')
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

app.get('/v1/programmes', async (_, res) => {
  await scheduleProgrammes()
  res.locals.msg('Scheduled programmes')
})

app.post('/v1/students', async (req, res) => {
  await scheduleByStudentNumbers(req.body.studentnumbers)
  res.locals.msg('Scheduled studentnumbers')
})

app.get('/v1/structure/:code', async (req, res) => {
  try {
    const studyModule = await getStructure(req.params.code)
    res.json(studyModule)
  } catch (e) {
    res.json({ error: e })
  }
})

app.get('/v1/courses/:code', async (req, res) => {
  try {
    const superFlatten = Boolean(req.query.superFlatten)
    const studyModule = await getCourses(req.params.code, superFlatten)
    res.json(studyModule)
  } catch (e) {
    console.log(e)
    res.json({ error: e })
  }
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
