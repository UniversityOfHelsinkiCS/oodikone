const { groupBy, flatten } = require('lodash')
const { Organization, Course } = require('../db/models')
const { selectFromByIds, selectFromSnapshotsByIds, bulkCreate } = require('../db')
const { getMinMaxDate, getMinMax } = require('../utils')

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
  const attainments = await selectFromByIds(
    'attainments',
    courseUnits.map(c => c.id),
    'course_unit_id'
  )
  const courseIdToAttainments = groupBy(attainments, 'course_unit_id')
  const groupIdToCourse = groupBy(courseUnits, 'group_id')

  const courses = Object.entries(groupIdToCourse).map(([, courses]) => {
    const { code, name, study_level: coursetypecode, id } = courses[0]
    const { min: startdate, max: enddate } = getMinMaxDate(
      courses,
      c => c.validity_period.startDate,
      c => c.validity_period.endDate
    )

    const attainments = flatten(courses.map(c => courseIdToAttainments[c.id])).filter(a => !!a)
    const { min: min_attainment_date, max: max_attainment_date } = getMinMax(
      attainments,
      a => a.attainment_date,
      a => a.attainment_date
    )

    return {
      id,
      name,
      code,
      coursetypecode,
      minAttainmentDate: min_attainment_date,
      maxAttainmentDate: max_attainment_date,
      latestInstanceDate: max_attainment_date,
      startdate,
      enddate,
      isStudyModule: false
    }
  })

  await bulkCreate(Course, courses)
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
    case 'course_units':
      return await updateHandler(await selectFromByIds(type, entityIds, 'group_id'))
    case 'modules':
    case 'educations':
    case 'course_unit_realisations':
      return await updateHandler(await selectFromByIds(type, entityIds))
  }
}

module.exports = {
  update
}
