import { CronJob } from 'cron'
import { helloWorld } from 'oodikone-shared'

import { isProduction, runningInCI } from './config'
import { getDegreeProgrammesOfFaculty } from './services/faculty/faculty'
import { getFaculties } from './services/faculty/facultyHelpers'
import { updateFacultyOverview, updateFacultyProgressOverview } from './services/faculty/facultyUpdates'
import { computeLanguageCenterData, LANGUAGE_CENTER_REDIS_KEY } from './services/languageCenterData'
import { findStudentsCloseToGraduation, CLOSE_TO_GRADUATION_REDIS_KEY } from './services/populations/closeToGraduation'
import { redisClient } from './services/redis'
import { getCurrentSemester } from './services/semesters'
import { combinedStudyprogrammes, isRelevantProgramme } from './services/studyProgramme/studyProgrammeHelpers'
import { updateBasicView, updateStudytrackView } from './services/studyProgramme/studyProgrammeUpdates'
import { getProgrammesFromStudyRights } from './services/studyrights'
import { findAndSaveTeachers } from './services/teachers/top'
import { deleteOutdatedUsers } from './services/userService'
import logger from './util/logger'
import { jobMaker, addToFlow } from './worker/queue'

helloWorld()

const schedule = (cronTime: string, onTick: () => void) => {
  const onComplete = null
  const start = true
  const timeZone = 'Europe/Helsinki'
  return new CronJob(cronTime, onTick, onComplete, start, timeZone)
}

export const refreshCloseToGraduating = async () => {
  logger.info('Refreshing students close to graduating')
  const updatedData = await findStudentsCloseToGraduation()
  await redisClient.setAsync(CLOSE_TO_GRADUATION_REDIS_KEY, JSON.stringify(updatedData))
  logger.info('Students close to graduating updated!')
}

export const refreshFaculty = async (code: string) => {
  await updateFacultyOverview(code, 'ALL')
  await updateFacultyProgressOverview(code)
}

export const refreshFaculties = async () => {
  logger.info('Adding jobs to refresh all faculties')
  const faculties = await getFaculties()
  for (const faculty of faculties) {
    jobMaker.faculty(faculty.code)
  }
}

export const refreshLanguageCenterData = async () => {
  logger.info('Refreshing language center data')
  const freshData = await computeLanguageCenterData()
  await redisClient.setAsync(LANGUAGE_CENTER_REDIS_KEY, JSON.stringify(freshData))
  logger.info('Language center data refreshed!')
}

const refreshProgrammesAndFaculties = async () => {
  const facultyCodes = (await getFaculties()).map(faculty => faculty.code)
  for (const faculty of facultyCodes) {
    const programmeCodes = (await getDegreeProgrammesOfFaculty(faculty, true))
      .map(programme => programme.code)
      .filter(code => isRelevantProgramme(code))
    await addToFlow(faculty, programmeCodes)
  }
}

export const refreshProgramme = async (code: string) => {
  await updateBasicView(code, '')
  await updateStudytrackView(code, '')
  const combinedProgramme = combinedStudyprogrammes[code] || ''
  await updateBasicView(code, combinedProgramme)
  await updateStudytrackView(code, combinedProgramme)
}

export const refreshProgrammes = async () => {
  logger.info('Refreshing study programme and study track overview statistics for all programmes')
  const programmes = await getProgrammesFromStudyRights()
  const codes = programmes.map(programme => programme.code).filter(code => isRelevantProgramme(code))
  for (const code of codes) {
    // If combined programme is given, this updates only the bachelor programme
    jobMaker.programme(code)
  }
}

const refreshTeacherLeaderboard = async () => {
  logger.info('Refreshing statistics for teacher leaderboard')
  const currentSemestersYearCode = (await getCurrentSemester()).getDataValue('yearcode')
  await findAndSaveTeachers(currentSemestersYearCode, currentSemestersYearCode - 1)
}

const dailyJobs = async () => {
  try {
    await refreshTeacherLeaderboard()
    await refreshProgrammesAndFaculties()
    jobMaker.languagecenter()
    jobMaker.closeToGraduation()
  } catch (error) {
    logger.error('Daily jobs failed', error)
  }
}

export const startCron = () => {
  if (isProduction && !runningInCI) {
    logger.info('Cronjob for refreshing stats started: runs daily at 23:00')
    schedule('0 23 * * *', async () => {
      logger.info('Running daily jobs from cron')
      await dailyJobs()
    })
    schedule('0 4 * * 3', async () => {
      logger.info("Deleting users who haven't logged in for 18 months")
      const [, result] = (await deleteOutdatedUsers()) as { rowCount: number }[]
      logger.info(`Deleted ${result.rowCount} users`)
    })
    schedule('0 19 * * 1', () => {
      logger.info('Updating students whose studyplans have not been updated recently')
      jobMaker.studyplansUpdate(4)
    })
    schedule('0 10 * * 2', () => {
      logger.info('Updating students whose studyplans have not been updated recently')
      jobMaker.studyplansUpdate(5)
    })
  }
}
