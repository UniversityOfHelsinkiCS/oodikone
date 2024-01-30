const { uniqBy, flatten, groupBy } = require('lodash')
const { Organization, Course, CourseType, CourseProvider, CreditType, StudyrightExtent } = require('../db/models')
const { selectFromByIdsOrderBy, bulkCreate } = require('../db')
const _ = require('lodash')
const { courseProviderMapper, courseMapper, mapCourseType, mapStudyrightExtent } = require('./mapper')

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

// sort substitutions so that main code is first
const newLetterBasedCode = /^[A-Za-z]/ // new letter based codes come first
const oldNumericCode = /^\d/ // old numeric codes come second
const openUniCode = /^AY?(.+?)(?:en|fi|sv)?$/ // open university codes come last
const openUniCodeA = /A\d/ // open university with just A come last
const digi = /DIGI-A?(.+?)(?:en|fi|sv)?$/ // digi-a goes on top courses goes third
const bscsCode = /BSCS??/

const codeRegexes = [openUniCodeA, openUniCode, bscsCode, oldNumericCode, newLetterBasedCode, digi]

// Compile the above RegEx'es into one. This saves considerable amount of time
// compared to executing each one independently.
const codeRegex = RegExp(codeRegexes.map(r => `(${r.source})`).join('|'))

const getSubstitutionPriority = _.memoize(code => {
  const match = codeRegex.exec(code)

  if (!match) {
    return 3 // if no hit, put before open uni courses
  }

  // Use the index of the first matched and captured subgroup as the priority
  return match.splice(1).findIndex(x => x !== undefined)
})

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

    const organisationsById = {}

    for (const { organisations: courseUnitOrganisations, validity_period: courseUnitValidityPeriod } of courses) {
      if (!courseUnitOrganisations) {
        continue
      }
      for (const { share, organisationId, roleUrn, validityPeriod = {} } of courseUnitOrganisations) {
        const effectiveValidityPeriod = Object.keys(validityPeriod).length ? validityPeriod : courseUnitValidityPeriod
        const shareObj = {
          share,
          ...(effectiveValidityPeriod.startDate && { startDate: effectiveValidityPeriod.startDate }),
          ...(effectiveValidityPeriod.endDate && { endDate: effectiveValidityPeriod.endDate }),
        }

        if (!organisationsById[organisationId]) {
          organisationsById[organisationId] = { organisationId, roleUrn, shares: [shareObj] }
        } else {
          organisationsById[organisationId].shares.push(shareObj)
        }
      }
    }

    const organisations = Object.values(organisationsById)

    const mapCourseProvider = courseProviderMapper(groupId)
    courseProviders.push(
      ...organisations
        .filter(({ roleUrn }) => roleUrn === 'urn:code:organisation-role:responsible-organisation')
        .map(mapCourseProvider)
    )
    return mapCourse(groupedCourse, substitutions)
  })

  // change substitutions ids to course codes and update

  for (const course of courses) {
    const newSubstitutions = []
    for (const sub of course.substitutions) {
      const subs = await Course.findOne({
        attributes: ['code'],
        where: { id: sub },
      })

      if (subs) newSubstitutions.push(subs.dataValues.code)
    }

    course.substitutions = newSubstitutions

    const sortedSubstitutions = [course.code, ...course.substitutions]
      .map(code => [code, getSubstitutionPriority(code)])
      .sort((a, b) => b[1] - a[1])
    course.mainCourseCode = sortedSubstitutions[0][0]
  }

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
  const uniqueExtents = _.uniqBy(studyrightExtents, 'extentcode')
  await bulkCreate(StudyrightExtent, uniqueExtents, null, ['extentcode'])
}

module.exports = {
  updateOrganisations,
  updateStudyModules,
  updateCourseUnits,
  updateCourseTypes,
  updateCreditTypes,
  updateStudyrightExtents,
}
