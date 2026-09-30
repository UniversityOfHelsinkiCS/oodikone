import { chunk } from 'lodash-es'

import {
  CHUNK_SIZE,
  isDev,
  DEV_SCHEDULE_COUNT,
  REDIS_LAST_HOURLY_SCHEDULE,
  REDIS_LATEST_MESSAGE_RECEIVED,
  LATEST_MESSAGE_RECEIVED_THRESHOLD,
} from './config'
import { knexConnection } from './db/connection'
import { startPrePurge, startPurge } from './purge'
import { queue } from './queue'
import './jobEvents'
import { logger } from './utils/logger'
import { redisClient } from './utils/redis'

const IMPORTER_TABLES = {
  attainments: 'attainments',
  organisations: 'organisations',
  studyLevels: 'study_levels',
  educationTypes: 'education_types',
  studyYears: 'study_years',
  courseUnits: 'course_units',
  modules: 'modules',
  persons: 'persons',
  studyrights: 'studyrights',
  termRegistrations: 'term_registrations',
  studyRightPrimalities: 'study_right_primalities',
  curriculumPeriods: 'curriculum_periods',
  enrolments: 'enrolments',
}

type ScheduleFromDbParams = {
  table: string
  distinct?: string
  pluck?: string
  whereNotNull?: string
  scheduleId?: string
  limit?: typeof DEV_SCHEDULE_COUNT
  whereIn?: [string, string[]]
  clean?: boolean
}

const scheduleFromDb = async ({
  table,
  distinct,
  pluck = 'id',
  whereNotNull,
  scheduleId,
  limit,
  whereIn,
  clean = true,
}: ScheduleFromDbParams) => {
  const { knex } = knexConnection
  const knexBuilder = knex(table)
  if (distinct) knexBuilder.distinct(distinct)
  if (pluck) knexBuilder.pluck(pluck)
  if (whereNotNull) knexBuilder.whereNotNull(whereNotNull)
  if (limit) knexBuilder.limit(limit)
  if (whereIn) knexBuilder.whereIn(...whereIn)
  if (!clean) {
    const lastHourlyScheduleFromRedis = await redisClient.get(REDIS_LAST_HOURLY_SCHEDULE)
    const lastHourlySchedule = lastHourlyScheduleFromRedis ?? new Date(new Date().setHours(0, 0, 0, 0))
    knexBuilder.where('updated_at', '>=', new Date(lastHourlySchedule))
  }
  const entities = await knexBuilder
  const chunks = chunk<any>(entities, CHUNK_SIZE)
  await queue.addBulk(chunks.map(entities => ({ name: scheduleId ?? table, data: entities })))
  return entities.length
}

export const scheduleMeta = async (clean = true) => {
  await scheduleFromDb({
    table: IMPORTER_TABLES.organisations,
    clean,
  })

  await scheduleFromDb({
    table: IMPORTER_TABLES.studyLevels,
    clean,
  })

  await scheduleFromDb({
    table: IMPORTER_TABLES.educationTypes,
    clean,
  })

  const creditTypes = [4, 7, 9, 10]
  await queue.add('credit_types', creditTypes)

  await scheduleFromDb({
    table: IMPORTER_TABLES.courseUnits,
    distinct: 'group_id',
    pluck: 'group_id',
    limit: null,
    clean,
  })

  await scheduleFromDb({
    scheduleId: 'study_modules',
    table: IMPORTER_TABLES.modules,
    whereIn: ['type', ['StudyModule', 'DegreeProgramme']],
    distinct: 'group_id',
    pluck: 'group_id',
    limit: null,
    clean,
  })

  await scheduleFromDb({
    table: IMPORTER_TABLES.curriculumPeriods,
    clean,
  })
  logger.info('Scheduled meta')
}

export const scheduleStudents = async () => {
  await scheduleFromDb({
    scheduleId: 'students',
    table: IMPORTER_TABLES.persons,
    whereNotNull: 'student_number',
    pluck: 'id',
    limit: isDev ? DEV_SCHEDULE_COUNT : null,
  })
}

const getHourlyPersonsToUpdate = async () => {
  logger.info('Getting hourly persons to update')
  const { knex } = knexConnection
  const lastHourlyScheduleFromRedis = await redisClient.get(REDIS_LAST_HOURLY_SCHEDULE)
  const lastHourlySchedule = lastHourlyScheduleFromRedis ?? new Date(new Date().setHours(0, 0, 0, 0))
  const getUpdatedFrom = (table: string, pluck: string) => {
    const builder = knex(table).pluck(pluck)
    if (lastHourlySchedule) builder.where('updated_at', '>=', new Date(lastHourlySchedule))
    if (isDev && DEV_SCHEDULE_COUNT) builder.limit(DEV_SCHEDULE_COUNT)
    return builder
  }

  const [
    updatedPersons,
    updatedAttainmentStudents,
    updatedStudyrightStudents,
    updatedTermRegistrationStudents,
    updatedEnrollmentStudents,
  ] = await Promise.all([
    getUpdatedFrom(IMPORTER_TABLES.persons, 'id').whereNotNull('student_number'),
    getUpdatedFrom(IMPORTER_TABLES.attainments, 'person_id'),
    getUpdatedFrom(IMPORTER_TABLES.studyrights, 'person_id'),
    getUpdatedFrom(IMPORTER_TABLES.termRegistrations, 'student_id'),
    getUpdatedFrom(IMPORTER_TABLES.enrolments, 'person_id'),
  ])

  return Array.from(
    new Set([
      ...updatedPersons,
      ...updatedAttainmentStudents,
      ...updatedStudyrightStudents,
      ...updatedTermRegistrationStudents,
      ...updatedEnrollmentStudents,
    ])
  )
}

export const scheduleByStudentNumbers = async (studentNumbers: string[]) => {
  logger.info('Scheduling by student numbers')
  const { knex } = knexConnection
  const personsToUpdate = await knex('persons').column('id', 'student_number').whereIn('student_number', studentNumbers)
  const personChunks = chunk(personsToUpdate, CHUNK_SIZE)
  await queue.addBulk(personChunks.map(personsToUpdate => ({ name: 'students_with_purge', data: personsToUpdate })))
}

export const scheduleByCourseCodes = async (courseCodes: string[]) => {
  logger.info('Scheduling course codes')
  const { knex } = knexConnection
  const coursesToUpdate = await knex(IMPORTER_TABLES.courseUnits)
    .whereIn('code', courseCodes)
    .distinct('group_id')
    .pluck('group_id')

  const courseChunks = chunk(coursesToUpdate, CHUNK_SIZE)
  await queue.addBulk(courseChunks.map(courses => ({ name: 'course_units', data: courses })))
}

export const isUpdaterActive = async () => {
  const latestUpdaterHandledMessage = await redisClient.get(REDIS_LATEST_MESSAGE_RECEIVED)
  return !!(
    latestUpdaterHandledMessage &&
    new Date().getTime() - new Date(latestUpdaterHandledMessage).getTime() <= LATEST_MESSAGE_RECEIVED_THRESHOLD
  )
}

export const scheduleHourly = async () => {
  try {
    // Update meta that have changed between now and the last update
    await scheduleMeta(false)

    // Update persons whose attainments, studyrights etc. have changed
    // between now and the last update
    const personsToUpdate = await getHourlyPersonsToUpdate()

    const personChunks = chunk(personsToUpdate, CHUNK_SIZE)
    await queue.addBulk(personChunks.map(personsToUpdate => ({ name: 'students', data: personsToUpdate })))
  } catch (error) {
    if (error instanceof Error) {
      logger.error({ message: 'Hourly scheduling failed', meta: error.stack })
      throw error
    }
  }
}

export const scheduleProgrammes = async () => {
  logger.info('Scheduling programmes')
  const { knex } = knexConnection

  const entityIds = await knex('modules').where({ type: 'DegreeProgramme' }).pluck('id')

  try {
    await queue.add('programme_modules', entityIds)
  } catch (error) {
    if (error instanceof Error) {
      logger.error({ message: 'Programme module scheduling failed', meta: error.stack })
      throw error
    }
  }
}

export const scheduleWeekly = async () => {
  try {
    await scheduleProgrammes()
    await scheduleMeta()
    await scheduleStudents()
  } catch (error) {
    if (error instanceof Error) {
      logger.error({ message: 'Weekly scheduling failed', meta: error.stack })
      throw error
    }
  }
}

export const schedulePrePurge = async () => {
  try {
    await startPrePurge()
  } catch (error) {
    if (error instanceof Error) {
      logger.error({ message: 'Scheduling prepurge failed', meta: error.stack })
      throw error
    }
  }
}

export const schedulePurge = async () => {
  try {
    await startPurge()
  } catch (error) {
    if (error instanceof Error) {
      logger.error({ message: 'Scheduling purge failed', meta: error.stack })
      throw error
    }
  }
}
