import { uniqBy, flatten, groupBy, memoize } from 'lodash-es'
import { Op } from 'sequelize'
import { rootOrgId } from '../config.js'
import { bulkCreate, selectFromByIdsOrderBy } from '../db/index.js'
import {
  Course,
  CourseProvider,
  CourseType,
  CreditType,
  CurriculumPeriod,
  Organization,
  StudyrightExtent,
} from '../db/models/index.js'
import {
  courseMapper,
  courseProviderMapper,
  mapCourseType,
  mapStudyrightExtent,
  mapCurriculumPeriod,
} from './mapper.js'

export const updateOrganisations = async organisations => {
  await bulkCreate(Organization, organisations)
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

const getSubstitutionPriority = memoize(code => {
  const match = codeRegex.exec(code)

  if (!match) {
    return 3 // if no hit, put before open uni courses
  }

  // Use the index of the first matched and captured subgroup as the priority
  return match.splice(1).findIndex(x => x !== undefined)
})

const updateCourses = async (courseIdToAttainments, groupIdToCourse) => {
  const courseProviders = []
  const courses = Object.entries(groupIdToCourse).map(groupedCourse => {
    const [groupId, courses] = groupedCourse

    // Take substitutions from all course units
    const substitutions = new Set()
    for (const course of courses) {
      for (const sub of flatten(course.substitutions)) {
        substitutions.add(sub.courseUnitGroupId)
      }
    }

    const organisationsById = {}

    for (const { organisations: courseUnitOrganisations, validity_period: courseUnitValidityPeriod } of courses) {
      if (!courseUnitOrganisations) continue
      for (const { share, organisationId, roleUrn, validityPeriod } of courseUnitOrganisations) {
        const { startDate, endDate } = validityPeriod ?? courseUnitValidityPeriod ?? {}

        organisationsById[organisationId] ??= { organisationId, roleUrn, shares: [] }
        organisationsById[organisationId].shares.push({
          share,
          ...(startDate && { startDate }),
          ...(endDate && { endDate }),
        })
      }
    }

    const mapCourseProvider = courseProviderMapper(groupId)
    const organisations = Object.values(organisationsById)
      .filter(({ roleUrn }) => roleUrn === 'urn:code:organisation-role:responsible-organisation')
      .map(mapCourseProvider)

    courseProviders.push(...organisations)

    const mapCourse = courseMapper(courseIdToAttainments)
    return mapCourse(groupedCourse, Array.from(substitutions))
  })

  // change substitutions ids to course codes and update
  for (const course of courses) {
    course.substitutions = (
      await Course.findAll({
        attributes: ['code'],
        where: {
          id: { [Op.in]: course.substitutions },
        },
        raw: true,
      })
    ).map(({ code }) => code)

    course.mainCourseCode = [course.code, ...course.substitutions]
      .sort((a, b) => getSubstitutionPriority(b) - getSubstitutionPriority(a))
      .at(0)
  }

  await bulkCreate(Course, courses)
  await bulkCreate(
    CourseProvider,
    uniqBy(courseProviders, cP => `${cP.coursecode}-${cP.organizationcode}`),
    null,
    ['coursecode', 'organizationcode']
  )
}

export const updateStudyModules = async studyModules => {
  const organizationStudyModules = studyModules.filter(s => s.university_org_ids.includes(rootOrgId))
  const attainments = await selectFromByIdsOrderBy(
    'attainments',
    organizationStudyModules.map(s => s.id),
    'module_id',
    'attainment_date'
  )

  const courseIdToAttainments = groupBy(attainments, 'module_id')
  const groupIdToCourse = groupBy(organizationStudyModules, 'group_id')

  await updateCourses(courseIdToAttainments, groupIdToCourse)
}

export const updateCourseUnits = async courseUnits => {
  const attainments = await selectFromByIdsOrderBy(
    'attainments',
    courseUnits.map(course => course.id),
    'course_unit_id',
    'attainment_date'
  )

  const courseIdToAttainments = groupBy(attainments, 'course_unit_id')
  const groupIdToCourse = groupBy(courseUnits, 'group_id')

  await updateCourses(courseIdToAttainments, groupIdToCourse)
}

export const updateCourseTypes = async studyLevels => {
  await bulkCreate(CourseType, studyLevels.map(mapCourseType))
}

export const updateCreditTypes = async creditTypes => {
  await bulkCreate(CreditType, creditTypes)
}

export const updateStudyrightExtents = async educationTypes => {
  const studyrightExtents = educationTypes.map(mapStudyrightExtent).filter(eT => eT.extentcode)
  const uniqueExtents = uniqBy(studyrightExtents, 'extentcode')
  await bulkCreate(StudyrightExtent, uniqueExtents, null, ['extentcode'])
}

export const updateCurriculumPeriods = async curriculumPeriods => {
  const mappedCurriculumPeriods = curriculumPeriods.map(mapCurriculumPeriod)
  await bulkCreate(CurriculumPeriod, mappedCurriculumPeriods)
}
