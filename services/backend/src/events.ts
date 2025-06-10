import { CronJob } from 'cron'

import { isProduction, runningInCI, languageCenterViewEnabled, CRON_SCHEDULE } from './config'
import { getDegreeProgrammesOfFaculty } from './services/faculty/faculty'
import { getFaculties } from './services/faculty/facultyHelpers'
import { updateFacultyOverview, updateFacultyProgressOverview } from './services/faculty/facultyUpdates'
import { computeLanguageCenterData, LANGUAGE_CENTER_REDIS_KEY } from './services/languageCenterData'
import { findStudentsCloseToGraduation, CLOSE_TO_GRADUATION_REDIS_KEY } from './services/populations/closeToGraduation'
import { redisClient } from './services/redis'
import { getCurrentSemester } from './services/semesters'
import { combinedStudyProgrammes, isRelevantProgramme } from './services/studyProgramme/studyProgrammeHelpers'
import { updateBasicView, updateStudyTrackView } from './services/studyProgramme/studyProgrammeUpdates'
import { findAndSaveTeachers } from './services/teachers/top'
import { deleteOutdatedUsers } from './services/userService'
import logger from './util/logger'
import { jobMaker, addToFlow } from './worker/queue'

const schedule = (cronTime: string, onTick: () => void) => {
  const onComplete = null
  const start = true
  const timeZone = 'Europe/Helsinki'
  return new CronJob(cronTime, onTick, onComplete, start, timeZone)
}

export const refreshCloseToGraduating = async () => {
  logger.info('Refreshing students close to graduating')
  const updatedData = await findStudentsCloseToGraduation()
  await redisClient.set(
    CLOSE_TO_GRADUATION_REDIS_KEY,
    JSON.stringify({ ...updatedData, lastUpdated: new Date().toISOString() })
  )
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
  await redisClient.set(LANGUAGE_CENTER_REDIS_KEY, JSON.stringify(freshData))
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
  await updateStudyTrackView(code, '')
  const combinedProgramme = combinedStudyProgrammes[code] ?? ''
  await updateBasicView(code, combinedProgramme)
  await updateStudyTrackView(code, combinedProgramme)
}

export const refreshProgrammes = async () => {
  logger.info('Refreshing study programme and study track overview statistics for all programmes')
  const facultyCodes = (await getFaculties()).map(faculty => faculty.code)
  const programmeCodes: string[] = []
  for (const faculty of facultyCodes) {
    const programmesOfFaculty = (await getDegreeProgrammesOfFaculty(faculty, true))
      .map(programme => programme.code)
      .filter(code => isRelevantProgramme(code))
    programmeCodes.push(...programmesOfFaculty)
  }
  for (const code of programmeCodes) {
    // If combined programme is given, this updates only the bachelor programme
    jobMaker.programme(code)
  }
}

export const refreshTeacherLeaderboard = async () => {
  logger.info('Refreshing statistics for teacher leaderboard')
  const currentSemestersYearCode = (await getCurrentSemester()).getDataValue('yearcode')
  await findAndSaveTeachers(currentSemestersYearCode, currentSemestersYearCode - 1)
}

const dailyJobs = async () => {
  try {
    await refreshTeacherLeaderboard()
    await refreshProgrammesAndFaculties()
    if (languageCenterViewEnabled) jobMaker.languagecenter()
    jobMaker.closeToGraduation()
  } catch (error) {
    logger.error('Daily jobs failed', error)
  }
}

export const startCron = () => {
  if (isProduction && !runningInCI) {
    logger.info(`Cronjob for refreshing stats started: runs at "${CRON_SCHEDULE}"`)
    schedule(CRON_SCHEDULE, async () => {
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
