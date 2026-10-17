import { REDIS_LAST_PREPURGE_INFO, SLACK_WEBHOOK } from './config'
import { queue } from './queue'
import { logger } from './utils/logger'
import { redisClient } from './utils/redis'

const PURGE_ROWS_OLDER_THAN_DAYS = 30
const MINIMUM_DAYS_BETWEEN_PREPURGE_AND_PURGE = 4
const PREPURGE_ROWS_OLDER_THAN_DAYS = PURGE_ROWS_OLDER_THAN_DAYS - MINIMUM_DAYS_BETWEEN_PREPURGE_AND_PURGE

const TABLES_TO_PURGE = [
  'course',
  'course_providers',
  'course_types',
  'credit',
  'credit_teachers',
  'credit_types',
  'organization',
  'sis_study_right_elements',
  'sis_study_rights',
  'studyright_extents',
  'teacher',
]

export const sendToSlack = async (text: string) => {
  logger.info('Sending to slack', { text })
  if (!SLACK_WEBHOOK) {
    logger.warn('SLACK_WEBHOOK environment variable is not set. Skipping Slack notification.')
    return
  }

  try {
    const res = await fetch(SLACK_WEBHOOK, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    })
    if (!res.ok) {
      throw new Error(`Failed to send to Slack. HTTP status: ${res.status}`)
    }
  } catch (error) {
    logger.error('Failed to send to Slack', { error })
  }
}

const getPrePurgeDates = () => {
  const prePurgeThresholdDate = new Date()
  prePurgeThresholdDate.setDate(prePurgeThresholdDate.getDate() - PREPURGE_ROWS_OLDER_THAN_DAYS)

  const purgeStartDate = new Date()
  purgeStartDate.setDate(purgeStartDate.getDate() + MINIMUM_DAYS_BETWEEN_PREPURGE_AND_PURGE)

  return { prePurgeThresholdDate, purgeStartDate }
}

const getPrePurgeInfo = async () => {
  try {
    const infoString = await redisClient.get(REDIS_LAST_PREPURGE_INFO)
    return infoString ? JSON.parse(infoString) : {}
  } catch (error) {
    logger.error('Failed to parse prepurge info from Redis', { error })
    return {}
  }
}

const setPurgeInfo = async purgeTargetDate => {
  const { purgeStartDate } = getPrePurgeDates()
  await redisClient.set(REDIS_LAST_PREPURGE_INFO, JSON.stringify({ purgeAfterDate: purgeStartDate, purgeTargetDate }))
}

// TODO: Type jobs and queue
export const setupPurge = async ({ counts, before }: { counts: number; before: any }) => {
  const rowsToBeDeleted = Object.entries(counts)
    .map(([table, count]) => (count === 0 ? null : `${count} rows from ${table}`))
    .filter(Boolean)
    .join('\n')

  const status = rowsToBeDeleted ? `${rowsToBeDeleted}\n+ CASCADEs applied to all tables` : 'No data will be deleted.'

  const message =
    `The next purge will take place in at least ${MINIMUM_DAYS_BETWEEN_PREPURGE_AND_PURGE} days.\n` +
    `Data older than ${before} will be targeted for deletion.\n\n` +
    `Estimated rows to be deleted (prepurge count):\n${status}`

  await sendToSlack(message)
  await setPurgeInfo(before)
}

export const startPrePurge = async () => {
  const { prePurgeThresholdDate: before } = getPrePurgeDates()
  await queue.add('prepurge_start', { tables: TABLES_TO_PURGE, before })
}

const canPurge = purgeAfterDate => {
  if (!purgeAfterDate) {
    logger.info('Purge was scheduled but has no valid start date. Skipping purge.')
    return false
  }

  const scheduledDate = new Date(purgeAfterDate)
  const now = new Date()

  if (now < scheduledDate) {
    logger.info(`Purge is not allowed before ${scheduledDate.toISOString()}. Skipping purge.`)
    return false
  }

  return true
}

export const startPurge = async () => {
  const { purgeAfterDate, purgeTargetDate } = await getPrePurgeInfo()

  if (canPurge(purgeAfterDate)) {
    await queue.add('purge_start', { tables: TABLES_TO_PURGE, before: purgeTargetDate })
  }
}
