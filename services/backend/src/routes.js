const shibbolethHeadersFix = require('unfuck-utf8-headers-middleware')
const accessLogger = require('./middleware/accesslogger')
const sentryUserId = require('./middleware/sentryUserId')
const courses = require('./routes/courses')
const students = require('./routes/students')
const population = require('./routes/population')
const login = require('./routes/login')
const superlogin = require('./routes/superlogin')
const language = require('./routes/language')
const users = require('./routes/users')
const elementdetails = require('./routes/elementdetails')
const auth = require('./middleware/auth')
const teachers = require('./routes/teachers')
const providers = require('./routes/providers')
const faculties = require('./routes/faculties')
const semesters = require('./routes/semesters')
const mandatoryCourses = require('./routes/mandatorycourses')
const mandatoryCourseLabels = require('./routes/mandatorycourselabels')
const ping = require('./routes/ping')
const feedback = require('./routes/feedback')
const tags = require('./routes/tags')
const updater = require('./routes/updater')
const tsaAnalytics = require('./routes/tsaAnalytics')
const matomoInit = require('./routes/matomo-init')
const customPopulationSearch = require('./routes/customPopulationSearch')
const trends = require('./routes/trends')
const programmeModules = require('./routes/programmeModules')
const studyGuidanceGroups = require('./routes/studyGuidanceGroups')

module.exports = (app, url) => {
  app.use(url, ping)
  app.use(
    shibbolethHeadersFix([
      'hyGroupCn',
      'SHIB_LOGOUT_URL',
      'eduPersonAffiliation',
      'uid',
      'displayName',
      'mail',
      'hyPersonSisuId',
      'preferredLanguage',
    ])
  )
  app.use(url, matomoInit)
  app.use(url, login)
  app.use(`${url}/superlogin`, superlogin)
  app.use(auth.checkAuth, auth.checkRequiredGroup, auth.checkUserBlacklisting, accessLogger, sentryUserId)
  app.use(url, elementdetails)
  app.use(url, courses)
  app.use(url, students)
  app.use(url, population)
  app.use(url, language)
  app.use(url, providers)
  app.use(url, semesters)
  app.use(url, tags)
  app.use(url, programmeModules)
  app.use(`${url}/faculties`, faculties)
  app.use(`${url}/updater`, auth.roles(['admin']), updater)
  app.use(`${url}/teachers`, auth.roles(['teachers']), teachers)
  app.use(`${url}/users`, auth.roles(['users']), users)
  app.use(`${url}/feedback`, feedback)
  app.use(`${url}/mandatory_courses`, mandatoryCourses)
  app.use(`${url}/mandatory-course-labels`, mandatoryCourseLabels)
  app.use(`${url}/tsa`, tsaAnalytics)
  app.use(`${url}/custom-population-search`, customPopulationSearch)
  app.use(`${url}/cool-data-science`, trends)
  app.use(`${url}/studyguidancegroups`, auth.roles(['personGroups']), studyGuidanceGroups)
}
