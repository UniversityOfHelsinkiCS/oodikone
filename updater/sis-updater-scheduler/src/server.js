const express = require('express')
require('express-async-errors')
const { logger } = require('./utils/logger')
const { stan } = require('./utils/stan')
const {
  scheduleMeta,
  scheduleStudents,
  scheduleProgrammes,
  scheduleByStudentNumbers,
  scheduleByCourseCodes,
} = require('./scheduler')
const { getStructure } = require('./explorer')
const { getCourses } = require('./courseParser')
const { SECRET_TOKEN } = require('./config')

const bakeMessage =
  res =>
  (message = '', status = 200) => {
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
  logger.error(err.stack)
  res.locals.msg('Internal server error', 500)
  next(err)
}

const app = express()
app.use(express.json())
app.use(message)
app.use(auth)

app.get('/v1/meta', async (_, res) => {
  await scheduleMeta()

  logger.info('Scheduled meta')
  res.locals.msg('Scheduled meta')
})

app.get('/v1/students', async (_, res) => {
  await scheduleStudents()

  logger.info('Scheduled students')
  res.locals.msg('Scheduled students')
})

app.get('/v1/programmes', async (_, res) => {
  await scheduleProgrammes()

  logger.info('Scheduled programmes')
  res.locals.msg('Scheduled programmes')
})

app.post('/v1/students', async (req, res) => {
  const studentnumbers = req.body.studentnumbers.map(n => (n[0] === '0' ? n : `0${n}`))

  logger.info(JSON.stringify(studentnumbers))
  logger.info('Scheduling studentnumbers')

  await scheduleByStudentNumbers(studentnumbers)
  res.locals.msg('Scheduled studentnumbers')
})

app.get('/v1/rediscache', async (req, res) => {
  stan.publish('SIS_INFO_CHANNEL', JSON.stringify({ message: 'RELOAD_REDIS' }), err => {
    if (err) {
      return res.locals.msg('Error sending reloading msg?')
    }

    logger.info('Scheduled redis cache reloading')
    res.locals.msg('Scheduled redis cache reloading')
  })
})

app.get('/v1/abort', async (req, res) => {
  stan.publish('SIS_INFO_CHANNEL', JSON.stringify({ message: 'ABORT' }), err => {
    if (err) {
      return res.locals.msg('Error sending abort msg?')
    }

    logger.info('Abort message sent')
    res.locals.msg('Abort message sent')
  })
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
    logger.error({ message: 'Failed to get courses codes recursively', meta: e.stack })
    res.json({ error: e })
  }
})

app.post('/v1/courses', async (req, res) => {
  await scheduleByCourseCodes(req.body.coursecodes)

  logger.info('Scheduled courses')
  res.locals.msg('Scheduled courses')
})

app.use(errorBoundary)

const PORT = 8082
const startServer = () => {
  app.listen(PORT, () => {
    logger.info(`Scheduler server listening on port ${PORT}`)
  })
}

module.exports = {
  startServer,
}
