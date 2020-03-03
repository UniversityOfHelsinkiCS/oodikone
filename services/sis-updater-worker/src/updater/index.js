const { selectFromByIds, selectFromSnapshotsByIds } = require('../db')
const { creditTypeIdsToCreditTypes } = require('./shared')
const { updateStudents } = require('./updateStudents')
const {
  updateOrganisations,
  updateStudyModules,
  updateCourseUnits,
  updateCourseTypes,
  updateSemesters,
  updateCreditTypes,
  updateStudyrightExtents
} = require('./updateMeta')

const idToHandler = {
  students: updateStudents,
  organisations: updateOrganisations,
  study_modules: updateStudyModules,
  course_units: updateCourseUnits,
  study_levels: updateCourseTypes,
  study_years: updateSemesters,
  credit_types: updateCreditTypes,
  education_types: updateStudyrightExtents
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
    case 'study_years':
      return await updateHandler(await selectFromByIds(type, entityIds, 'org'))
    case 'study_modules':
      return await updateHandler(await selectFromByIds('modules', entityIds, 'group_id'))
    case 'education_types':
    case 'study_levels':
      return await updateHandler(await selectFromByIds(type, entityIds))
  }
}

module.exports = {
  update
}
