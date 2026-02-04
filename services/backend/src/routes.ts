import * as Sentry from '@sentry/node'
import compression from 'compression'
import cors from 'cors'
import { Express, json as jsonExpress } from 'express'

import { frontUrl, languageCenterViewEnabled, serviceProvider } from './config'
import accessLogger from './middleware/accessLogger'
import * as auth from './middleware/auth'
import currentUserMiddleware from './middleware/currentUser'
import errorHandler from './middleware/errorHandler'
import headersMiddleware from './middleware/headers'
import changelog from './routes/changelog'
import closeToGraduation from './routes/closeToGraduation'
import completedCoursesSearch from './routes/completedCoursesSearch'
import courseExclusions from './routes/courseExclusions'
import courses from './routes/courses'
import curriculumPeriods from './routes/curriculumPeriods'
import customOpenUniSearch from './routes/customOpenUniSearch'
import customPopulationSearch from './routes/customPopulationSearch'
import faculties from './routes/faculties'
import feedback from './routes/feedback'
import languageCenterData from './routes/languageCenterData'
import login from './routes/login'
import population from './routes/population'
import programmeModules from './routes/programmeModules'
import providers from './routes/providers'
import semesters from './routes/semesters'
import students from './routes/students'
import studyGuidanceGroups from './routes/studyGuidanceGroups'
import studyProgramme from './routes/studyProgramme'
import studyProgrammeCriteria from './routes/studyProgrammeCriteria'
import studyProgrammePins from './routes/studyProgrammePins'
import tags from './routes/tags'
import teachers from './routes/teachers'
import university from './routes/university'
import updater from './routes/updater'
import usersToska from './routes/users'
import usersFd from './routes/usersFd'

const routes = (app: Express, url: string) => {
  app.use(cors({ credentials: true, origin: frontUrl }))
  app.use(jsonExpress())
  app.use(compression())

  // For docker healthchecks, has to run before `currentUserMiddleware`
  app.get('/health', (_, res) => {
    return res.status(200).send('OK')
  })

  app.use(headersMiddleware)
  app.use(currentUserMiddleware) // eslint-disable-line @typescript-eslint/no-misused-promises
  app.use(accessLogger)
  app.use(`${url}/login`, login)
  app.use(url, courses)
  app.use(`${url}/students`, students)
  app.use(url, population)
  app.use(`${url}/providers`, providers)
  app.use(`${url}/semesters/codes`, semesters)
  app.use(url, tags)
  app.use(url, programmeModules)
  app.use(`${url}/v3/course-exclusions`, courseExclusions)
  app.use(`${url}/v2/studyprogrammes`, studyProgramme)
  app.use(`${url}/programme-criteria`, studyProgrammeCriteria)
  app.use(`${url}/openunisearch`, auth.roles(['openUniSearch']), customOpenUniSearch)
  app.use(`${url}/changelog`, changelog)
  app.use(`${url}/completedcoursessearch`, completedCoursesSearch)
  if (languageCenterViewEnabled) {
    app.use(`${url}/languagecenterdata`, languageCenterData)
  }
  app.use(`${url}/faculties`, faculties)
  app.use(`${url}/university`, university)
  app.use(`${url}/updater`, auth.roles(['admin']), updater)
  app.use(`${url}/teachers`, teachers)
  if (serviceProvider === 'toska') {
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
  app.use(`${url}/curriculum-periods`, curriculumPeriods)
  app.get('*', (_, res) => {
    res.status(404).json({ error: 'unknown endpoint' })
  })
  Sentry.setupExpressErrorHandler(app)
  app.use(errorHandler)
}

export default routes
