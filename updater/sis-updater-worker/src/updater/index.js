const { selectFromByIds, selectLatestActiveFromSnapshotsByIds } = require('../db')
const { creditTypeIdsToCreditTypes } = require('./shared')
const {
  updateOrganisations,
  updateStudyModules,
  updateCourseUnits,
  updateCourseTypes,
  updateCreditTypes,
  updateStudyrightExtents,
  updateCurriculumPeriods,
} = require('./updateMeta')
const { updateProgrammeModules } = require('./updateProgrammeModules/updateProgrammeModules')
const { updateStudents } = require('./updateStudents')

const idToHandler = {
  students: updateStudents,
  organisations: updateOrganisations,
  study_modules: updateStudyModules,
  course_units: updateCourseUnits,
  study_levels: updateCourseTypes,
  credit_types: updateCreditTypes,
  education_types: updateStudyrightExtents,
  programme_modules: updateProgrammeModules,
  curriculum_periods: updateCurriculumPeriods,
}

const update = async ({ entityIds, type }) => {
  const updateHandler = idToHandler[type]

  switch (type) {
    case 'students':
      return await updateHandler(entityIds)
    case 'credit_types':
      return await updateHandler(creditTypeIdsToCreditTypes(entityIds))
    case 'organisations':
      return await updateHandler(await selectLatestActiveFromSnapshotsByIds(type, entityIds))
    case 'course_units':
      return await updateHandler(await selectFromByIds(type, entityIds, 'group_id'))
    case 'study_modules':
      return await updateHandler(await selectFromByIds('modules', entityIds, 'group_id'))
    case 'education_types':
      return await updateHandler(await selectFromByIds(type, entityIds))
    case 'study_levels':
      return await updateHandler(await selectFromByIds(type, entityIds))
    case 'programme_modules':
      return await updateHandler(entityIds)
    case 'curriculum_periods':
      return await updateHandler(await selectFromByIds(type, entityIds))
    default:
      break
  }
}

module.exports = {
  update,
}
