const Sentry = require('@sentry/node')
const express = require('express')
const cors = require('cors')
const { frontUrl } = require('./conf-backend')
const shibbolethCharsetMiddleware = require('./middleware/shibbolethCharsetMiddleware')
const matomoInit = require('./routes/matomo-init')
const currentUserMiddleware = require('./middleware/currentUserMiddleware')
const accessLogger = require('./middleware/accessLogger')
const auth = require('./middleware/auth')

const courses = require('./routes/courses')
const students = require('./routes/students')
const population = require('./routes/population')
const login = require('./routes/login')
const language = require('./routes/language')
const users = require('./routes/users')
const elementdetails = require('./routes/elementdetails')
const teachers = require('./routes/teachers')
const providers = require('./routes/providers')
const faculties = require('./routes/faculties')
const semesters = require('./routes/semesters')
const mandatoryCourses = require('./routes/mandatorycourses')
const mandatoryCourseLabels = require('./routes/mandatorycourselabels')
const feedback = require('./routes/feedback')
const tags = require('./routes/tags')
const updater = require('./routes/updater')
const tsaAnalytics = require('./routes/tsaAnalytics')
const customPopulationSearch = require('./routes/customPopulationSearch')
const trends = require('./routes/trends')
const programmeModules = require('./routes/programmeModules')
const studyGuidanceGroups = require('./routes/studyGuidanceGroups')
const studyProgramme = require('./routes/studyProgramme')
const initializeSentry = require('./util/sentry')

const errorMiddleware = require('./middleware/errorMiddleware')

module.exports = (app, url) => {
  initializeSentry(app)
  app.use(Sentry.Handlers.requestHandler())
  app.use(Sentry.Handlers.tracingHandler())

  app.use(cors({ credentials: true, origin: frontUrl }))
  app.use(express.json())

  app.use(shibbolethCharsetMiddleware)
  app.use(url, matomoInit)
  app.use(currentUserMiddleware)
  app.use(accessLogger)
  app.use(url, login)
  app.use(url, elementdetails)
  app.use(url, courses)
  app.use(url, students)
  app.use(url, population)
  app.use(url, language)
  app.use(url, providers)
  app.use(url, semesters)
  app.use(url, tags)
  app.use(url, programmeModules)
  app.use(url, studyProgramme)
  app.use(url, faculties)
  app.use(`${url}/updater`, auth.roles(['admin']), updater)
  app.use(`${url}/teachers`, auth.roles(['teachers']), teachers)
  app.use(`${url}/users`, auth.roles(['admin']), users)
  app.use(`${url}/feedback`, feedback)
  app.use(`${url}/mandatory_courses`, mandatoryCourses)
  app.use(`${url}/mandatory-course-labels`, mandatoryCourseLabels)
  app.use(`${url}/tsa`, tsaAnalytics)
  app.use(`${url}/custom-population-search`, customPopulationSearch)
  app.use(`${url}/cool-data-science`, trends)
  app.use(`${url}/studyguidancegroups`, auth.roles(['studyGuidanceGroups']), studyGuidanceGroups)
  app.get('*', async (_, res) => {
    const results = { error: 'unknown endpoint' }
    res.status(404).json(results)
  })
  app.use(Sentry.Handlers.errorHandler())
  app.use(errorMiddleware)
}
