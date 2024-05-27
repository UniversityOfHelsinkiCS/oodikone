const { Op } = require('sequelize')

const { PURGE_LOCK, SIS_PURGE_CHANNEL } = require('../config')
const {
  Organization,
  Course,
  CourseType,
  Student,
  CourseProvider,
  Semester,
  SemesterEnrollment,
  Teacher,
  CreditType,
  Credit,
  CreditTeacher,
  ElementDetail,
  StudyrightExtent,
  Studyright,
  StudyrightElement,
  ProgrammeModule,
} = require('../db/models')
const { logger } = require('../utils/logger')
const { lock } = require('../utils/redis')
const { stan } = require('../utils/stan')

const tableToModel = {
  course: Course,
  course_providers: CourseProvider,
  course_types: CourseType,
  credit: Credit,
  credit_teachers: CreditTeacher,
  credit_types: CreditType,
  element_details: ElementDetail,
  organization: Organization,
  semester_enrollments: SemesterEnrollment,
  semesters: Semester,
  student: Student,
  studyright: Studyright,
  studyright_elements: StudyrightElement,
  studyright_extents: StudyrightExtent,
  teacher: Teacher,
  programme_modules: ProgrammeModule,
}

const sendToNats = (channel, data) =>
  new Promise((res, rej) => {
    stan.publish(channel, JSON.stringify(data), err => {
      if (err) {
        logger.error({ message: 'Failed publishing to nats', meta: err.stack })
        rej(err)
      }
      res()
    })
  })

const prePurge = async ({ table, before }) => {
  const count = await tableToModel[table].count({
    where: {
      updatedAt: {
        [Op.lt]: new Date(before),
      },
    },
  })

  sendToNats(SIS_PURGE_CHANNEL, { action: 'PREPURGE_STATUS', table, count, before })
}

const purge = async ({ table, before }) => {
  const unlock = await lock(PURGE_LOCK, 1000 * 60 * 60)
  const deletedCount = await tableToModel[table].destroy({
    where: {
      updatedAt: {
        [Op.lt]: new Date(before),
      },
    },
  })

  logger.info({
    message: 'Purge',
    table,
    count: deletedCount,
  })
  unlock()
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
