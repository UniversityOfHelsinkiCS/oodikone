const { CronJob } = require('cron')

const { isProduction, runningInCI } = require('./conf-backend')
const { updateFacultyOverview, updateFacultyProgressOverview } = require('./services/faculty/facultyUpdates')
const { computeLanguageCenterData, LANGUAGE_CENTER_REDIS_KEY } = require('./services/languageCenterData')
const { faculties } = require('./services/organisations')
const {
  findStudentsCloseToGraduation,
  CLOSE_TO_GRADUATION_REDIS_KEY,
} = require('./services/populations/closeToGraduation')
const { redisClient } = require('./services/redis')
const { getCurrentSemester } = require('./services/semesters')
const { combinedStudyprogrammes, isOldOrObsolete } = require('./services/studyProgramme/studyProgrammeHelpers')
const { updateBasicView, updateStudytrackView } = require('./services/studyProgramme/studyProgrammeUpdates')
const { getAssociations, getProgrammesFromStudyRights, refreshAssociationsInRedis } = require('./services/studyrights')
const { findAndSaveTeachers } = require('./services/topteachers')
const { deleteOutdatedUsers } = require('./services/userService')
const logger = require('./util/logger')
const { jobMaker } = require('./worker/queue')

const schedule = (cronTime, func) => new CronJob({ cronTime, onTick: func, start: true, timeZone: 'Europe/Helsinki' })

const refreshStudyrightAssociations = async () => {
  await refreshAssociationsInRedis()
  logger.info('Studyright associations refreshed!')
}

const refreshFaculties = async () => {
  logger.info('Adding jobs to refresh all faculties')
  const facultyList = (await faculties()).filter(faculty => !['Y', 'H99', 'Y01', 'H92', 'H930'].includes(faculty.code))
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
  } catch (error) {
    logger.error({ message: `Failed to update stats for faculty ${code} with type ALL`, meta: `${error}` })
  }
}

const refreshProgrammes = async () => {
  logger.info('Refreshing studyprogramme and studytrack overview statistics for all programmes')

  const programmes = await getProgrammesFromStudyRights()
  const codes = programmes.map(programme => programme.code).filter(code => isOldOrObsolete(code))

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

  const combinedProgramme = combinedStudyprogrammes[code] || ''
  await updateBasicView(code, combinedProgramme)
  await updateStudytrackView(code, combinedProgramme, associations)
}

const refreshTeacherLeaderboard = async () => {
  // refresh this and previous year
  const currentSemestersYearCode = (await getCurrentSemester()).getDataValue('yearcode')
  await findAndSaveTeachers(currentSemestersYearCode - 1, currentSemestersYearCode)
}

const refreshStatistics = async () => {
  const statfuncs = [refreshStudyrightAssociations, refreshTeacherLeaderboard]
  logger.info('Refreshing statistics')
  for (const func of statfuncs) {
    await func()
  }
  logger.info('Statistics refreshed!')
}

const refreshLanguageCenterData = async () => {
  logger.info('Refreshing language center data...')
  const freshData = await computeLanguageCenterData()
  await redisClient.setAsync(LANGUAGE_CENTER_REDIS_KEY, JSON.stringify(freshData))
  logger.info('Language center data refreshed!')
}

const refreshCloseToGraduating = async () => {
  logger.info('Updating students close to graduating...')
  const updatedData = await findStudentsCloseToGraduation()
  await redisClient.setAsync(CLOSE_TO_GRADUATION_REDIS_KEY, JSON.stringify(updatedData))
  logger.info('Students close to graduating updated!')
}

const dailyJobs = () => {
  refreshFaculties()
  refreshProgrammes()
  jobMaker.languagecenter()
  jobMaker.statistics()
}

const startCron = () => {
  if (isProduction && !runningInCI) {
    logger.info('Cronjob for refreshing stats started: runs daily at 23:00.')
    schedule('0 23 * * *', async () => {
      logger.info('Running daily jobs from cron')
      dailyJobs()
    })
    // This needs to be its own job because refreshing study right associations in `refreshStatistics` causes some study right info to be not available, causing this job to fail
    schedule('0 3 * * *', async () => {
      jobMaker.closeToGraduation()
    })
    schedule('0 4 * * 3', async () => {
      logger.info("Deleting users who haven't logged in for 18 months")
      const [, result] = await deleteOutdatedUsers()
      logger.info(`Deleted ${result.rowCount} users.`)
    })
    schedule('0 19 * * 1', async () => {
      logger.info('Updating students whose studyplans have not been updated recently')
      jobMaker.studyplansUpdate(4)
    })
    schedule('0 10 * * 2', async () => {
      logger.info('Updating students whose studyplans have not been updated recently')
      jobMaker.studyplansUpdate(5)
    })
  }
}

module.exports = {
  startCron,
  refreshStatistics,
  refreshFaculties,
  refreshFaculty,
  refreshProgramme,
  refreshProgrammes,
  refreshLanguageCenterData,
  refreshCloseToGraduating,
}
