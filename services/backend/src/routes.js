const Sentry = require('@sentry/node')
const express = require('express')
const cors = require('cors')
const { frontUrl } = require('./conf-backend')
const shibbolethCharsetMiddleware = require('./middleware/shibbolethCharsetMiddleware')
const currentUserMiddleware = require('./middleware/currentUserMiddleware')
const accessLogger = require('./middleware/accessLogger')
const auth = require('./middleware/auth')
const changelog = require('./routes/changelog')
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
const university = require('./routes/university')
const courseExclusions = require('./routes/courseExclusions')
const semesters = require('./routes/semesters')
const feedback = require('./routes/feedback')
const tags = require('./routes/tags')
const updater = require('./routes/updater')
const customPopulationSearch = require('./routes/customPopulationSearch')
const languageCenterData = require('./routes/languageCenterData')
const programmeModules = require('./routes/programmeModules')
const studyGuidanceGroups = require('./routes/studyGuidanceGroups')
const studyProgramme = require('./routes/studyProgramme')
const customOpenUniSearch = require('./routes/customOpenUniSearch')
const studyProgrammeCriteria = require('./routes/studyProgrammeCriteria')
const initializeSentry = require('./util/sentry')
const completedCoursesSearch = require('./routes/completedCoursesSearch')
const errorMiddleware = require('./middleware/errorMiddleware')
module.exports = (app, url) => {
  initializeSentry(app)
  app.use(Sentry.Handlers.requestHandler())
  app.use(Sentry.Handlers.tracingHandler())

  app.use(cors({ credentials: true, origin: frontUrl }))
  app.use(express.json())

  app.use(shibbolethCharsetMiddleware)
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
  app.use(url, courseExclusions)
  app.use(url, studyProgramme)
  app.use(`${url}/programmecriteria`, studyProgrammeCriteria)
  app.use(`${url}/openunisearch`, auth.roles(['openUniSearch']), customOpenUniSearch)
  app.use(`${url}/changelog`, changelog)
  app.use(`${url}/completedcoursessearch`, completedCoursesSearch)
  app.use(`${url}/languagecenterdata`, languageCenterData)
  app.use(`${url}/faculties`, auth.roles(['facultyStatistics', 'katselmusViewer']), faculties)
  app.use(`${url}/university`, university)
  app.use(`${url}/updater`, auth.roles(['admin']), updater)
  app.use(`${url}/teachers`, auth.roles(['teachers']), teachers)
  app.use(`${url}/users`, auth.roles(['admin']), users)
  app.use(`${url}/feedback`, feedback)
  app.use(`${url}/custom-population-search`, customPopulationSearch)
  app.use(`${url}/studyguidancegroups`, auth.roles(['studyGuidanceGroups']), studyGuidanceGroups)
  app.get('*', async (_, res) => {
    const results = { error: 'unknown endpoint' }
    res.status(404).json(results)
  })
  app.use(Sentry.Handlers.errorHandler())
  app.use(errorMiddleware)
}
