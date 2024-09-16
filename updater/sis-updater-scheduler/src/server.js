const express = require('express')

require('express-async-errors')
const { SECRET_TOKEN, REDIS_LATEST_MESSAGE_RECEIVED } = require('./config')
const { sendToSlack } = require('./purge')
const {
  scheduleMeta,
  scheduleStudents,
  scheduleProgrammes,
  scheduleByStudentNumbers,
  scheduleByCourseCodes,
} = require('./scheduler')
const { logger } = require('./utils/logger')
const { redisClient } = require('./utils/redis')
const { stan } = require('./utils/stan')

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

const errorBoundary = (error, _, res, next) => {
  logger.error(error.stack)
  res.locals.msg('Internal server error', 500)
  next(error)
}

const app = express()
app.use(express.json())
app.use(message)

app.get('/v1/healthcheck', async (_, res) => {
  const latestMessage = await redisClient.get(REDIS_LATEST_MESSAGE_RECEIVED)
  const threshold = new Date().getTime() - 1000 * 60 * 60 * 6 // 6 hours ago
  if (!latestMessage || new Date(latestMessage).getTime() < threshold) {
    return res.status(400).send()
  }
  res.status(200).send()
})

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

app.post('/v1/studyplans', async (req, res) => {
  const { studentnumbers } = req.body
  const msg = `Scheduling update of ${studentnumbers.length} students whose studyplan has not been updated recently`
  logger.info(msg)
  sendToSlack(msg)
  await scheduleByStudentNumbers(studentnumbers)
  res.locals.msg('Shceduled studyplans update')
})

app.get('/v1/programmes', async (_, res) => {
  await scheduleProgrammes()

  logger.info('Scheduled programmes')
  res.locals.msg('Scheduled programmes')
})

app.post('/v1/students', async (req, res) => {
  const studentnumbers = req.body.studentnumbers.map(n => (n[0] === '0' ? n : `0${n}`))

  logger.info(`Scheduling ${studentnumbers.length} custom studentnumbers`)

  await scheduleByStudentNumbers(studentnumbers)
  res.locals.msg('Scheduled studentnumbers')
})

app.get('/v1/rediscache', async (req, res) => {
  stan.publish('SIS_INFO_CHANNEL', JSON.stringify({ message: 'RELOAD_REDIS' }), error => {
    if (error) {
      return res.locals.msg('Error sending reloading msg?')
    }

    logger.info('Scheduled redis cache reloading')
    res.locals.msg('Scheduled redis cache reloading')
  })
})

app.get('/v1/abort', async (req, res) => {
  stan.publish('SIS_INFO_CHANNEL', JSON.stringify({ message: 'ABORT' }), error => {
    if (error) {
      return res.locals.msg('Error sending abort msg?')
    }

    logger.info('Abort message sent')
    res.locals.msg('Abort message sent')
  })
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
