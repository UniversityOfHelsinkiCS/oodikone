const { Organization } = require('../db/models')
const { selectFromByIds, selectFromSnapshotsByIds, bulkCreate } = require('../db')

const updateOrganisations = async organisations => {
  await bulkCreate(Organization, organisations)
}

const updateModules = async modules => {
  console.log('modules', modules)
}

const updateEducations = async educations => {
  console.log('educations', educations)
}

const updateCourseUnits = async courseUnits => {
  console.log('courseUnits', courseUnits)
}

const updateAssessmentItems = async assessmentItems => {
  console.log('assessmentItems', assessmentItems)
}

const updateCourseUnitRealisations = async courseUnitRealisations => {
  console.log('courseUnitRealisations', courseUnitRealisations)
}

const updateStudents = async personIds => {
  const [students, studyRights, attainments, termRegistrations] = await Promise.all([
    selectFromByIds('persons', personIds),
    selectFromSnapshotsByIds('studyrights', personIds, 'person_id'),
    selectFromByIds('attainments', personIds, 'person_id'),
    selectFromByIds('term_registrations', personIds, 'student_id')
  ])

  console.log('students', students)
  await updateStudyRights(studyRights.map(({ studyright }) => studyright))
  await Promise.all([updateAttainments(attainments), updateTermRegistrations(termRegistrations)])
}

const updateStudyRights = async studyRights => {
  console.log('studyRights', studyRights)
}

const updateAttainments = async attainments => {
  console.log('attainments', attainments)
}

const updateTermRegistrations = async termRegistrations => {
  console.log('termRegistrations', termRegistrations)
}

const idToHandler = {
  students: updateStudents,
  organisations: updateOrganisations,
  modules: updateModules,
  educations: updateEducations,
  assessment_items: updateAssessmentItems,
  course_units: updateCourseUnits,
  course_unit_realisations: updateCourseUnitRealisations
}

const update = async ({ entityIds, type }) => {
  const updateHandler = idToHandler[type]
  switch (type) {
    case 'students':
      return await updateHandler(entityIds)
    case 'organisations':
    case 'assessment_items':
      return await updateHandler(await selectFromSnapshotsByIds(type, entityIds))
    case 'modules':
    case 'educations':
    case 'course_units':
    case 'course_unit_realisations':
      return await updateHandler(await selectFromByIds(type, entityIds))
  }
}

module.exports = {
  update
}
