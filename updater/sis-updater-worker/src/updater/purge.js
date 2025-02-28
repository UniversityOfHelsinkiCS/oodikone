const { Op } = require('sequelize')

const { PURGE_LOCK } = require('../config')
const {
  Organization,
  Course,
  CourseType,
  Student,
  CourseProvider,
  Semester,
  Teacher,
  CreditType,
  Credit,
  CreditTeacher,
  StudyrightExtent,
  ProgrammeModule,
} = require('../db/models')
const { logger } = require('../utils/logger')
const { lock } = require('../utils/redis')

const tableToModel = {
  course: Course,
  course_providers: CourseProvider,
  course_types: CourseType,
  credit: Credit,
  credit_teachers: CreditTeacher,
  credit_types: CreditType,
  organization: Organization,
  semesters: Semester,
  student: Student,
  studyright_extents: StudyrightExtent,
  teacher: Teacher,
  programme_modules: ProgrammeModule,
}

const prePurge = async ({ tables, before }) => {
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

const purge = async ({ tables, before }) => {
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

const purgeByStudentNumber = async studentNumbers => {
  await Student.destroy({
    where: { studentnumber: studentNumbers },
  })
}

module.exports = {
  purge,
  prePurge,
  purgeByStudentNumber,
}
