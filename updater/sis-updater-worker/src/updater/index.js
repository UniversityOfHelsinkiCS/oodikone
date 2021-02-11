const { Op } = require('sequelize')
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
  ProgrammeModule
} = require('../db/models')
const { selectFromByIds, selectFromSnapshotsByIds } = require('../db')
const { creditTypeIdsToCreditTypes } = require('./shared')
const { updateStudents } = require('./updateStudents')
const { updateProgrammeModules } = require('./updateProgrammeModules')
const {
  updateOrganisations,
  updateStudyModules,
  updateCourseUnits,
  updateCourseTypes,
  updateCreditTypes,
  updateStudyrightExtents
} = require('./updateMeta')
const { lock } = require('../utils/redis')
const { PURGE_LOCK } = require('../config')
const { logger } = require('../utils/logger')

const idToHandler = {
  students: updateStudents,
  organisations: updateOrganisations,
  study_modules: updateStudyModules,
  course_units: updateCourseUnits,
  study_levels: updateCourseTypes,
  credit_types: updateCreditTypes,
  education_types: updateStudyrightExtents,
  programme_modules: updateProgrammeModules
}

const update = async ({ entityIds, type }) => {
  const updateHandler = idToHandler[type]
  switch (type) {
    case 'students':
      return await updateHandler(entityIds)
    case 'credit_types':
      return await updateHandler(creditTypeIdsToCreditTypes(entityIds))
    case 'organisations':
      return await updateHandler(await selectFromSnapshotsByIds(type, entityIds))
    case 'course_units':
      return await updateHandler(await selectFromByIds(type, entityIds, 'group_id'))
    case 'study_modules':
      return await updateHandler(await selectFromByIds('modules', entityIds, 'group_id'))
    case 'education_types':
    case 'study_levels':
      return await updateHandler(await selectFromByIds(type, entityIds))
    case 'programme_modules':
      return await updateHandler(entityIds)
  }
}

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
  programme_modules: ProgrammeModule
}

const purge = async ({ table, before }) => {
  const unlock = await lock(PURGE_LOCK, 1000 * 60 * 60)
  const deletedCount = await tableToModel[table].destroy({
    where: {
      updatedAt: {
        [Op.lt]: new Date(before)
      }
    }
  })

  logger.info({
    message: 'Purge',
    table,
    count: deletedCount
  })
  unlock()
}

const purgeByStudentNumber = async (studentNumbers) => {
  await Student.destroy({
    where: { studentnumber: studentNumbers }
  })
}

module.exports = {
  update,
  purge,
  purgeByStudentNumber,
}
