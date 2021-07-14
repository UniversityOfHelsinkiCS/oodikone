const { sortBy, uniqBy, flatten, groupBy } = require('lodash')
const { Organization, Course, CourseType, CourseProvider, CreditType, StudyrightExtent } = require('../db/models')
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
  const courseProviders = []
  const mapCourse = courseMapper(courseIdToAttainments)

  const courses = Object.entries(groupIdToCourse).map(groupedCourse => {
    const [groupId, courses] = groupedCourse

    // Take substitutions from all course units
    const substitutions = [
      ...new Set(
        courses.reduce((acc, curr) => {
          return [...acc, ...flatten(curr.substitutions).map(({ courseUnitGroupId }) => courseUnitGroupId)]
        }, [])
      ),
    ]

    // Take organisation for the newest course_unit of this groupid
    const coursesSortedByStartDate = sortBy(courses, 'validity_period.startDate')
    const { organisations } = coursesSortedByStartDate[coursesSortedByStartDate.length - 1]
    const mapCourseProvider = courseProviderMapper(groupId)
    courseProviders.push(
      ...(organisations || [])
        .filter(({ roleUrn }) => roleUrn === 'urn:code:organisation-role:responsible-organisation')
        .map(mapCourseProvider)
    )

    return mapCourse(groupedCourse, substitutions)
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
  updateStudyrightExtents,
}
