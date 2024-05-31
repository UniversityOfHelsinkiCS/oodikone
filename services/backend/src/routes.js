const Sentry = require('@sentry/node')
const cors = require('cors')
const express = require('express')

const { frontUrl } = require('./conf-backend')
const accessLogger = require('./middleware/accessLogger')
const auth = require('./middleware/auth')
const currentUserMiddleware = require('./middleware/currentUserMiddleware')
const errorMiddleware = require('./middleware/errorMiddleware')
const shibbolethCharsetMiddleware = require('./middleware/shibbolethCharsetMiddleware')
const changelog = require('./routes/changelog')
const closeToGraduation = require('./routes/closeToGraduation')
const completedCoursesSearch = require('./routes/completedCoursesSearch')
const courseExclusions = require('./routes/courseExclusions')
const courses = require('./routes/courses')
const customOpenUniSearch = require('./routes/customOpenUniSearch')
const customPopulationSearch = require('./routes/customPopulationSearch')
const elementdetails = require('./routes/elementdetails')
const faculties = require('./routes/faculties')
const feedback = require('./routes/feedback')
const languageCenterData = require('./routes/languageCenterData')
const login = require('./routes/login')
const population = require('./routes/population')
const programmeModules = require('./routes/programmeModules')
const providers = require('./routes/providers')
const semesters = require('./routes/semesters')
const students = require('./routes/students')
const studyGuidanceGroups = require('./routes/studyGuidanceGroups')
const studyProgramme = require('./routes/studyProgramme')
const studyProgrammeCriteria = require('./routes/studyProgrammeCriteria')
const studyProgrammePins = require('./routes/studyProgrammePins')
const tags = require('./routes/tags')
const teachers = require('./routes/teachers')
const university = require('./routes/university')
const updater = require('./routes/updater')
const users = require('./routes/users')
const initializeSentry = require('./util/sentry')

module.exports = (app, url) => {
  initializeSentry(app)
  app.use(Sentry.Handlers.requestHandler())
  app.use(Sentry.Handlers.tracingHandler())

  app.use(cors({ credentials: true, origin: frontUrl }))
  app.use(express.json())

  app.use(shibbolethCharsetMiddleware)
  app.use(currentUserMiddleware)
  app.use(accessLogger)
  app.use(`${url}/login`, login)
  app.use(url, elementdetails)
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
  app.use(`${url}/users`, users)
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
  app.use(errorMiddleware)
}
