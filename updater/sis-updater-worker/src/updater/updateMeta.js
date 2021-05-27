const { uniqBy, flattenDeep, groupBy } = require('lodash')
const {
  Organization,
  Course,
  CourseType,
  CourseProvider,
  CreditType,
  StudyrightExtent
} = require('../db/models')
const { selectFromByIdsOrderBy, bulkCreate } = require('../db')
const { courseProviderMapper, courseMapper, mapCourseType, mapSemester, mapStudyrightExtent } = require('./mapper')

const updateOrganisations = async organisations => {
  await bulkCreate(Organization, organisations)
}

const updateStudyModules = async studyModules => {
  const hyStudyModules = studyModules.filter(s => !s.university_org_ids.includes('aalto-university-root-id'))
  const attainments = await selectFromByIdsOrderBy(
    'attainments',
    hyStudyModules.map(s => s.id),
    'module_id',
    'attainment_date'
  )
  const courseIdToAttainments = groupBy(attainments, 'module_id')
  const groupIdToCourse = groupBy(hyStudyModules, 'group_id')

  await updateCourses(courseIdToAttainments, groupIdToCourse)
}

const updateCourseUnits = async courseUnits => {
  const attainments = await selectFromByIdsOrderBy(
    'attainments',
    courseUnits.map(c => c.id),
    'course_unit_id',
    'attainment_date'
  )
  const courseIdToAttainments = groupBy(attainments, 'course_unit_id')
  const groupIdToCourse = groupBy(courseUnits, 'group_id')

  await updateCourses(courseIdToAttainments, groupIdToCourse)
}

const updateCourses = async (courseIdToAttainments, groupIdToCourse) => {
  //console.log("=== ATTAINMENTS ===")
  //Object.keys(courseIdToAttainments).forEach(courseId => {
  //  console.log("courseId", courseId)
  //  courseIdToAttainments[courseId].forEach(attainment => {
  //    const { id, organisations } = attainment
  //    console.log("id: ", id)
  //    console.log("org: ", organisations)
  //  })
  //})
  //console.log("=== COURSE UNITS ===")
  //Object.keys(groupIdToCourse).forEach(groupId => {
  //  console.log("groupId ", groupId)
  //  groupIdToCourse[groupId].forEach(course => {
  //    const { id, organisations } = course
  //    console.log("id: ", id)
  //    console.log("org: ", organisations)
  //  })
  //})

  const courseProviders = []
  const mapCourse = courseMapper(courseIdToAttainments)
  const containsValidOrganisation = organisations => 
    !!organisations.find(o => o.organisationId !== 'hy-org-virhe')

  const courses = Object.entries(groupIdToCourse).map(groupedCourse => {
    const [groupId, courses] = groupedCourse
    const courseWithValidOrganisation = courses.find(c => 
      containsValidOrganisation(c.organisations)
    )
    //console.log("valid orgs ", courseWithValidOrganisation)
    const organisations = courseWithValidOrganisation 
      ? courseWithValidOrganisation.organisations 
      : courses[0].organisations
    //console.log("organisations", organisations)
    const mapCourseProvider = courseProviderMapper(groupId)
    courseProviders.push(
      ...(organisations || [])
        .filter(({ roleUrn }) => roleUrn === 'urn:code:organisation-role:responsible-organisation')
        .map(mapCourseProvider)
    )

    return mapCourse(groupedCourse)
  })

  await bulkCreate(Course, courses)
  await bulkCreate(
    CourseProvider,
    uniqBy(courseProviders, cP => cP.composite),
    null,
    ['composite']
  )
}

const updateCourseTypes = async studyLevels => {
  await bulkCreate(CourseType, studyLevels.map(mapCourseType))
}

const updateCreditTypes = async creditTypes => {
  await bulkCreate(CreditType, creditTypes)
}

const updateStudyrightExtents = async educationTypes => {
  const studyrightExtents = educationTypes.map(mapStudyrightExtent).filter(eT => eT.extentcode)
  await bulkCreate(StudyrightExtent, studyrightExtents, null, ['extentcode'])
}

module.exports = {
  updateOrganisations,
  updateStudyModules,
  updateCourseUnits,
  updateCourseTypes,
  updateCreditTypes,
  updateStudyrightExtents
}
