const { sortBy, uniqBy, flattenDeep, groupBy, mapValues } = require('lodash')
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
const { getMinMaxDate } = require('../utils')
const { educationTypeToExtentcode } = require('./shared')

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
  const courses = Object.entries(groupIdToCourse).map(([groupId, courses]) => {
    const { code, name, study_level: coursetypecode, organisations } = courses[0]
    organisations
      .filter(({ roleUrn }) => roleUrn === 'urn:code:organisation-role:responsible-organisation')
      .forEach(({ organisationId }) => {
        courseProviders.push({
          composite: `${groupId}-${organisationId}`,
          coursecode: groupId,
          organizationcode: organisationId
        })
      })
    const { min: startdate, max: enddate } = getMinMaxDate(
      courses,
      c => c.validity_period.startDate,
      c => c.validity_period.endDate
    )

    const timify = t => new Date(t).getTime()

    const { min_attainment_date, max_attainment_date } = courses.reduce(
      (res, curr) => {
        const courseAttainments = courseIdToAttainments[curr.id]
        if (!courseAttainments || courseAttainments.length === 0) return res

        let min_attainment_date = res.min_attainment_date
        let max_attainment_date = res.max_attainment_date

        if (!min_attainment_date || timify(min_attainment_date) > timify(courseAttainments[0].attainment_date))
          min_attainment_date = courseAttainments[0].attainment_date
        if (!max_attainment_date || timify(max_attainment_date) < timify(courseAttainments[curr.length - 1]))
          max_attainment_date = courseAttainments[courseAttainments.length - 1].attainment_date

        return { min_attainment_date, max_attainment_date }
      },
      { min_attainment_date: null, max_attainment_date: null }
    )

    return {
      id: groupId,
      name,
      code,
      coursetypecode,
      min_attainment_date,
      max_attainment_date,
      latest_instance_date: max_attainment_date,
      startdate,
      enddate,
      isStudyModule: false
    }
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
  const mapStudyLevelToCourseType = studyLevel => ({
    coursetypecode: studyLevel.id,
    name: studyLevel.name
  })
  await bulkCreate(CourseType, studyLevels.map(mapStudyLevelToCourseType))
}

const updateSemesters = async studyYears => {
  const semesters = flattenDeep(
    Object.entries(groupBy(studyYears, 'org')).map(([org, orgStudyYears]) => {
      let semestercode = 1
      return sortBy(orgStudyYears, 'start_year').map(orgStudyYear => {
        return orgStudyYear.study_terms.map((studyTerm, i) => {
          const acualYear = new Date(studyTerm.valid.startDate).getFullYear()
          return {
            composite: `${org}-${semestercode}`,
            name: mapValues(studyTerm.name, n => {
              return `${n} ${acualYear}`
            }),
            startdate: studyTerm.valid.startDate,
            enddate: studyTerm.valid.endDate,
            yearcode: Number(orgStudyYear.start_year) - 1949, // lul! :D
            yearname: orgStudyYear.name,
            semestercode: semestercode++,
            org,
            termIndex: i,
            startYear: orgStudyYear.start_year
          }
        })
      })
    })
  )
  await bulkCreate(Semester, semesters)
}

const updateCreditTypes = async creditTypes => {
  await bulkCreate(CreditType, creditTypes)
}

const updateStudyrightExtents = async educationTypes => {
  const studyrightExtents = educationTypes
    .map(eT => ({
      extentcode: educationTypeToExtentcode[eT.id],
      name: eT.name
    }))
    .filter(eT => eT.extentcode)

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
