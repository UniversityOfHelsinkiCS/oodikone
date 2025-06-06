import { Op } from 'sequelize'

import { PURGE_LOCK } from '../config.js'
import {
  Organization,
  Course,
  CourseType,
  Student,
  CourseProvider,
  Teacher,
  CreditType,
  Credit,
  CreditTeacher,
  StudyrightExtent,
  SISStudyRightElement,
  SISStudyRight,
} from '../db/models/index.js'
import logger from '../utils/logger.js'
import { lock } from '../utils/redis.js'

const tableToModel = {
  course: Course,
  course_providers: CourseProvider,
  course_types: CourseType,
  credit: Credit,
  credit_teachers: CreditTeacher,
  credit_types: CreditType,
  organization: Organization,
  sis_study_right_elements: SISStudyRightElement,
  sis_study_rights: SISStudyRight,
  studyright_extents: StudyrightExtent,
  teacher: Teacher,
}

export const prePurge = async ({ tables, before }) => {
  const beforeDate = new Date(before)

  const counts = await Promise.all(
    tables.map(async table => {
      if (!tableToModel[table]) {
        logger.error(`Prepurge failed: Table "${table}" not found in tableToModel`)
        return null
      }

      const count = await tableToModel[table].count({
        where: {
          updatedAt: {
            [Op.lt]: beforeDate,
          },
        },
      })

      return { [table]: count }
    })
  )

  return counts.filter(Boolean).reduce((acc, curr) => ({ ...acc, ...curr }), {})
}

export const purge = async ({ tables, before }) => {
  const unlock = await lock(PURGE_LOCK, 1000 * 60 * 60)
  const beforeDate = new Date(before)

  try {
    await Promise.all(
      tables.map(async table => {
        if (!tableToModel[table]) {
          logger.error(`Purge failed: Table "${table}" not found in tableToModel`)
          return
        }

        const deletedCount = await tableToModel[table].destroy({
          where: {
            updatedAt: {
              [Op.lt]: beforeDate,
            },
          },
        })

        if (deletedCount > 0) {
          logger.info(`Purged ${deletedCount} row(s) from "${table}" (older than ${before}).`)
        }
      })
    )
  } catch (error) {
    logger.error('Purge failed', { error })
    throw error // Rethrow to make the BullMQ job fail
  } finally {
    await unlock()
  }
}

export const purgeByStudentNumber = async studentNumbers => {
  await Student.destroy({
    where: { studentnumber: studentNumbers },
  })
}
