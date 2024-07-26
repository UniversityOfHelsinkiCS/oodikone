const Sentry = require('@sentry/node')
const compression = require('compression')
const cors = require('cors')
const express = require('express')

const { frontUrl, serviceProvider } = require('./config')
const accessLogger = require('./middleware/accessLogger').default
const auth = require('./middleware/auth')
const currentUserMiddleware = require('./middleware/currentUser').default
const errorHandler = require('./middleware/errorHandler').default
const headersMiddleware = require('./middleware/headers').default
const changelog = require('./routes/changelog').default
const closeToGraduation = require('./routes/closeToGraduation').default
const completedCoursesSearch = require('./routes/completedCoursesSearch').default
const courseExclusions = require('./routes/courseExclusions').default
const courses = require('./routes/courses')
const customOpenUniSearch = require('./routes/customOpenUniSearch').default
const customPopulationSearch = require('./routes/customPopulationSearch').default
const faculties = require('./routes/faculties')
const feedback = require('./routes/feedback').default
const languageCenterData = require('./routes/languageCenterData').default
const login = require('./routes/login').default
const population = require('./routes/population')
const programmeModules = require('./routes/programmeModules').default
const providers = require('./routes/providers').default
const semesters = require('./routes/semesters').default
const students = require('./routes/students')
const studyGuidanceGroups = require('./routes/studyGuidanceGroups').default
const studyProgramme = require('./routes/studyProgramme').default
const studyProgrammeCriteria = require('./routes/studyProgrammeCriteria').default
const studyProgrammePins = require('./routes/studyProgrammePins').default
const tags = require('./routes/tags')
const teachers = require('./routes/teachers').default
const university = require('./routes/university')
const updater = require('./routes/updater')
const usersToska = require('./routes/users').default
const usersFd = require('./routes/usersFd').default
const initializeSentry = require('./util/sentry')

module.exports = (app, url) => {
  initializeSentry(app)

  app.use(Sentry.Handlers.requestHandler())
  app.use(Sentry.Handlers.tracingHandler())

  app.use(cors({ credentials: true, origin: frontUrl }))
  app.use(express.json())
  app.use(compression())

  app.use(headersMiddleware)
  app.use(currentUserMiddleware)
  app.use(accessLogger)
  app.use(`${url}/login`, login)
  app.use(url, courses)
  app.use(`${url}/students`, students)
  app.use(url, population)
  app.use(`${url}/providers`, providers)
  app.use(`${url}/semesters/codes`, semesters)
  app.use(url, tags)
  app.use(url, programmeModules)
  app.use(`${url}/v3/course_exclusions`, courseExclusions)
  app.use(`${url}/v2/studyprogrammes`, studyProgramme)
  app.use(`${url}/programmecriteria`, studyProgrammeCriteria)
  app.use(`${url}/openunisearch`, auth.roles(['openUniSearch']), customOpenUniSearch)
  app.use(`${url}/changelog`, changelog)
  app.use(`${url}/completedcoursessearch`, completedCoursesSearch)
  app.use(`${url}/languagecenterdata`, languageCenterData)
  app.use(`${url}/faculties`, faculties)
  app.use(`${url}/university`, university)
  app.use(`${url}/updater`, auth.roles(['admin']), updater)
  app.use(`${url}/teachers`, auth.roles(['teachers']), teachers)
  if (serviceProvider === 'Toska') {
    app.use(`${url}/users`, usersToska)
  } else {
    app.use(`${url}/users`, usersToska)
    app.use(`${url}/users`, usersFd)
  }
  app.use(`${url}/feedback`, feedback)
  app.use(`${url}/custom-population-search`, customPopulationSearch)
  app.use(`${url}/studyguidancegroups`, auth.roles(['studyGuidanceGroups']), studyGuidanceGroups)
  app.use(`${url}/close-to-graduation`, auth.roles(['fullSisuAccess', 'studyGuidanceGroups']), closeToGraduation)
  app.use(`${url}/study-programme-pins`, studyProgrammePins)
  app.get('*', async (_, res) => {
    const results = { error: 'unknown endpoint' }
    res.status(404).json(results)
  })
  app.use(Sentry.Handlers.errorHandler())
  app.use(errorHandler)
}
