const { uniqBy, flattenDeep, groupBy } = require('lodash')
const {
  Organization,
  Course,
  CourseType,
  CourseProvider,
  Semester,
  CreditType,
  StudyrightExtent
} = require('../db/models')
const { selectFromByIdsOrderBy, bulkCreate } = require('../db')
const { courseProviderMapper, courseMapper, mapCourseType, mapSemester, mapStudyrightExtent } = require('./mapper')

const updateOrganisations = async organisations => {
  await bulkCreate(Organization, organisations)
}

const updateStudyModules = async studyModules => {
  const attainments = await selectFromByIdsOrderBy(
    'attainments',
    studyModules.map(s => s.id),
    'module_id',
    'attainment_date'
  )
  const courseIdToAttainments = groupBy(attainments, 'module_id')
  const groupIdToCourse = groupBy(studyModules, 'group_id')

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
    const { organisations } = courses[0]
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

const updateSemesters = async studyYears => {
  // TIME TO HACK
  const startYear = 1950
  const endYear = 2025

  const org = 'hy-university-root-id'

  const semesters = []

  let semestercode = 1
  let yearcode = 1

  for (let year = startYear; year <= endYear; year++) {
    semesters.push({
      composite: `${org}-${semestercode}`,
      semestercode: semestercode++,
      name: {
        en: `Autumn ${year}`,
        fi: `Syksy ${year}`,
        sv: `Hösten ${year}`
      },
      startdate: `${year}-08-01`,
      enddate: `${year}-01-01`,
      yearcode,
      org,
      yearname: `${year}-${year+1}`,
      term_index: 0,
      start_year: year
    })

    semesters.push({
      composite: `${org}-${semestercode}`,
      semestercode: semestercode++,
      name: {
        en: `Spring ${year+1}`,
        fi: `Kevät ${year+1}`,
        sv: `Våren ${year+1}`
      },
      startdate: `${year+1}-01-01`,
      enddate: `${year+1}-08-01`,
      yearcode,
      org,
      yearname: `${year}-${year+1}`,
      term_index: 1,
      start_year: year
    })
    yearcode++;
  }

  //const semesters = flattenDeep(Object.entries(groupBy(studyYears, 'org')).map(mapSemester))
  await bulkCreate(Semester, semesters)
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
  updateSemesters,
  updateCreditTypes,
  updateStudyrightExtents
}
