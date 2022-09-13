const { CronJob } = require('cron')
const moment = require('moment')
const { refreshStatus, refreshStatusGraduated, refreshUber, getStartYears } = require('./services/trends')
const { refreshAssociationsInRedis } = require('./services/studyrights')
const { getAllProgrammes } = require('./services/studyrights')
const { updateBasicView, updateStudytrackView } = require('./services/studyprogrammeUpdates')
const { findAndSaveTeachers } = require('./services/topteachers')
const { faculties } = require('./services/organisations')
const { updateFacultyOverview } = require('./services/faculty/facultyUpdates')
const { isProduction } = require('./conf-backend')
const { getCurrentSemester } = require('./services/semesters')
const logger = require('./util/logger')

const schedule = (cronTime, func) => new CronJob({ cronTime, onTick: func, start: true, timeZone: 'Europe/Helsinki' })

const refreshStudyrightAssociations = async () => {
  await refreshAssociationsInRedis()
  logger.info('Studyright associations refreshed!')
}

const refreshFaculties = async () => {
  logger.info('Refreshing faculty overview statistics for all faculties')
  const facultyList = (await faculties()).filter(f => !['Y', 'H99', 'Y01', 'H92', 'H930'].includes(f.code))
  let ready = 0

  for (const faculty of facultyList) {
    try {
      await updateFacultyOverview(faculty.code, 'ALL')
      ready += 1
    } catch (e) {
      logger.error({ message: `Failed to update stats for faculty ${faculty?.code} with type ALL`, meta: e })
    }
    logger.info(`${ready}/${facultyList.length} faculties done`)
  }
  logger.info('Faculty stats refreshed!')
}

const refreshNewOverviews = async () => {
  logger.info('Refreshing studyprogramme and studytrack overview statistics for all programmes')
  const codes = (await getAllProgrammes())
    .map(p => p.code)
    .filter(code => code.includes('KH') || code.includes('MH') || /^(T)[0-9]{6}$/.test(code))
  let ready = 0
  for (const code of codes) {
    try {
      await updateBasicView(code)
      await updateStudytrackView(code)
      ready += 1
    } catch (e) {
      logger.error({ message: `Failed to update overview stats for programme ${code}`, meta: e })
    }
    logger.info(`${ready}/${codes.length} programmes done`)
  }
  logger.info('Studyprogramme and studytrack overview stats refreshed!')
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
      logger.error({ message: `Error when refreshing CDS uber year ${formattedYear}`, meta: e })
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

const startCron = () => {
  if (isProduction) {
    logger.info('Cronjob for refreshing stats started: runs at 3am every day.')
    // refresh 3am every day
    schedule('0 3 * * *', async () => {
      for (const func of [refreshStatistics, refreshTrends, refreshNewOverviews, refreshFaculties]) {
        await func()
      }
    })
  }
}

module.exports = {
  startCron,
  refreshStatistics,
  refreshTrends,
  refreshFaculties,
}
