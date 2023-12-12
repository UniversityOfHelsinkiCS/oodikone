const { CronJob } = require('cron')
const moment = require('moment')
const { refreshStatus, refreshStatusGraduated, refreshUber, getStartYears } = require('./services/trends')
const { refreshAssociationsInRedis } = require('./services/studyrights')
const { getAllProgrammes } = require('./services/studyrights')
const { updateBasicView, updateStudytrackView } = require('./services/studyprogrammeUpdates')
const { findAndSaveTeachers } = require('./services/topteachers')
const { faculties } = require('./services/organisations')
const { combinedStudyprogrammes } = require('./services/studyprogrammeHelpers')
const { updateFacultyOverview, updateFacultyProgressOverview } = require('./services/faculty/facultyUpdates')
const { isProduction } = require('./conf-backend')
const { getCurrentSemester } = require('./services/semesters')
const logger = require('./util/logger')
const { getAssociations } = require('./services/studyrights')
const { redisClient } = require('./services/redis')
const { computeLanguageCenterData, LANGUAGE_CENTER_REDIS_KEY } = require('./services/languageCenterData')
const { jobMaker } = require('./worker/queue')

const schedule = (cronTime, func) => new CronJob({ cronTime, onTick: func, start: true, timeZone: 'Europe/Helsinki' })

const refreshStudyrightAssociations = async () => {
  await refreshAssociationsInRedis()
  logger.info('Studyright associations refreshed!')
}

const refreshFaculties = async () => {
  logger.info('Adding jobs to refresh all faculties')
  const facultyList = (await faculties()).filter(f => !['Y', 'H99', 'Y01', 'H92', 'H930'].includes(f.code))
  for (const faculty of facultyList) {
    jobMaker.faculty(faculty.code)
  }
}

const refreshFaculty = async code => {
  logger.info('Started updating faculty')
  const start = new Date().getTime()
  try {
    await updateFacultyOverview(code, 'ALL')
    await updateFacultyProgressOverview(code)
    const time = new Date().getTime() - start
    logger.info(`Updated faculty ${code} (took ${(time / 1000 / 60).toFixed(2)} minutes)`)
  } catch (e) {
    logger.error({ message: `Failed to update stats for faculty ${code} with type ALL`, meta: `${e}` })
  }
}

const refreshProgrammes = async () => {
  logger.info('Refreshing studyprogramme and studytrack overview statistics for all programmes')
  // Filters out old programmes and special ones like Fitech studies. Filters also out the programmes starting with
  // 2_ or ending with _2. Those programmes are mapped to correct programme (studentProgrammeModuleFixer.js)
  const codes = (await getAllProgrammes())
    .map(p => p.code)
    .filter(
      code =>
        (code.includes('KH') && !code.startsWith('2_KH') && !code.endsWith('_2')) ||
        (code.includes('MH') && !code.startsWith('2_MH') && !code.endsWith('_2')) ||
        /^(T)[0-9]{6}$/.test(code)
    )

  // Ensure that studyright associations are refreshed before launching jobs, otherwise each job will do it
  await getAssociations()
  for (const code of codes) {
    // If combined programme is given, this updates only the bachelor programme
    jobMaker.programme(code)
  }
}

const refreshProgramme = async code => {
  const associations = await getAssociations()
  await updateBasicView(code, '')
  await updateStudytrackView(code, '', associations)

  let combinedProgramme = combinedStudyprogrammes[code] || ''
  await updateBasicView(code, combinedProgramme)
  await updateStudytrackView(code, combinedProgramme, associations)
}

const refreshTeacherLeaderboard = async () => {
  // refresh this and previous year
  const currentSemestersYearCode = (await getCurrentSemester()).getDataValue('yearcode')
  await findAndSaveTeachers(currentSemestersYearCode - 1, currentSemestersYearCode)
}

const refreshStatusToRedis = async () => {
  const unixMillis = moment().valueOf()
  const date = new Date(Number(unixMillis))

  date.setHours(23, 59, 59, 999)
  const showByYearOff = 'false'
  const showByYear = 'true'
  logger.info('Refreshing CDS Status')
  await refreshStatus(date.getTime(), showByYearOff)
  await refreshStatus(date.getTime(), showByYear)
  logger.info('Refreshing CDS Status doned')

  logger.info('Refreshing CDS Graduated')
  await refreshStatusGraduated(date.getTime(), showByYearOff)
  await refreshStatusGraduated(date.getTime(), showByYear)
  logger.info('Refreshing CDS graduated doned')
}

const refreshUberToRedis = async () => {
  const years = (await getStartYears()).map(({ studystartdate }) => studystartdate)
  for (const year of years) {
    const formattedYear = new Date(year).getFullYear()
    logger.info(`Refreshing CDS uber year ${formattedYear}`)
    const defaultQuery = { include_old_attainments: 'false', start_date: year }
    const oldAttainmentsQuery = { include_old_attainments: 'true', start_date: year }
    try {
      await refreshUber(defaultQuery)
      await refreshUber(oldAttainmentsQuery)
      logger.info(`Refreshing CDS uber year ${formattedYear} doned`)
    } catch (e) {
      logger.error({ message: `Error when refreshing CDS uber year ${formattedYear}`, meta: `${e}` })
    }
  }
  logger.info(`Refreshing CDS Uber data doned`)
}

const refreshStatistics = async () => {
  const statfuncs = [refreshStudyrightAssociations, refreshTeacherLeaderboard]
  logger.info('Refreshing statistics')
  for (const func of statfuncs) {
    await func()
  }
  logger.info('Statistics refreshed!')
}

const refreshTrends = async () => {
  const trendfuncs = [refreshStatusToRedis, refreshUberToRedis]
  logger.info('Refreshing trends')
  for (const func of trendfuncs) {
    await func()
  }
  logger.info('Trends refreshed!')
}

// eslint-disable-next-line no-unused-vars
const refreshLanguageCenterData = async () => {
  logger.info('Refreshing language center data...')
  const freshData = await computeLanguageCenterData()
  await redisClient.setAsync(LANGUAGE_CENTER_REDIS_KEY, JSON.stringify(freshData))
  logger.info('Language center data refreshed!')
}

const dailyJobs = () => {
  refreshFaculties()
  refreshProgrammes()
  jobMaker.languagecenter()
  jobMaker.trends()
  jobMaker.statistics()
}

const startCron = () => {
  if (isProduction) {
    logger.info('Cronjob for refreshing stats started: runs at 1am saturday.')
    schedule('0 1 * * *', async () => {
      logger.info('Running daily jobs from cron')
      dailyJobs()
    })
    schedule('0 19 * * 1', async () => {
      logger.info('Updating students whose studyplans have not been updated recently')
      jobMaker.studyplansUpdate(4)
    })
  }
}

module.exports = {
  startCron,
  refreshStatistics,
  refreshTrends,
  refreshFaculties,
  refreshFaculty,
  refreshProgramme,
  refreshProgrammes,
  refreshLanguageCenterData,
}
