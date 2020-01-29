const { flatten } = require('lodash')
const {
  selectStudentsByIds,
  selectStudyRightsByPersonIds,
  selectAttainmentsByPersonIds,
  selectTermRegistrationsByPersonIds,
  selectOrganisationsById
} = require('../db')

const update = async personIds => {
  const [students, studyRights, attainments, termRegistrations] = await Promise.all([
    selectStudentsByIds(personIds),
    selectStudyRightsByPersonIds(personIds),
    selectAttainmentsByPersonIds(personIds),
    selectTermRegistrationsByPersonIds(personIds)
  ])

  await updateStudents(students)
  await updateStudyRights(studyRights.map(({ studyright }) => studyright))
  await Promise.all([updateAttainments(attainments), updateTermRegistrations(termRegistrations)])
}

const updateStudents = async students => {
  console.log('students', students)
}

const updateStudyRights = async studyRights => {
  const organisationIds = flatten(studyRights).map(({ organisation_id }) => organisation_id)
  const organisations = await selectOrganisationsById(organisationIds)
  await updateOrganisations(organisations.map(({ organisation }) => organisation))
}

const updateOrganisations = async organisations => {
  console.log('organisations', organisations)
}

const updateAttainments = async attainments => {
  console.log('attainments', attainments)
}

const updateTermRegistrations = async termRegistrations => {
  console.log('termRegistrations', termRegistrations)
}

module.exports = {
  update
}
