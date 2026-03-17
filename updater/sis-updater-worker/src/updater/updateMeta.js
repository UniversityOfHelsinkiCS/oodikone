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
  const courses = Object.entries(groupIdToCourse).map(([groupId, courses]) => {
    // Take substitutions from all course units
    // NOTE: Modules DO NOT have substitutions fields.
    const substitutionArrays = courses.flatMap(
      course => course.substitutions?.map(subGroup => subGroup.map(sub => sub.courseUnitGroupId)) ?? []
    )
    const uniqueSubstitutionArrays = uniqBy(substitutionArrays, a => [...a].sort().join('|'))

    // TODO: Replace this old implementation of substitutions
    // Take substitutions from all course units
    const substitutions = [
      ...new Set(
        courses.reduce((acc, curr) => {
          return [...acc, ...flatten(curr.substitutions).map(({ courseUnitGroupId }) => courseUnitGroupId)]
        }, [])
      ),
    ]

    const organisationsById = {}

    for (const { organisations, validity_period: courseValidityPeriod } of courses) {
      if (!organisations) continue
      for (const { share, organisationId, roleUrn, validityPeriod } of organisations) {
        const { startDate, endDate } = validityPeriod ?? courseValidityPeriod ?? {}

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

    // TODO: Remove OLD substitutions when done
    return courseMapper(courseIdToAttainments)([groupId, courses], substitutions, uniqueSubstitutionArrays)
  })

  // change substitutions ids to course codes and update
  for (const course of courses) {
    // TODO: OLD substitutions
    const newSubstitutions = []
    for (const sub of course.substitutions) {
      const subs = await Course.findOne({
        attributes: ['code'],
        where: { id: sub },
      })

      if (subs) newSubstitutions.push(subs.dataValues.code)
    }

    course.substitutions = newSubstitutions

    const subtitutionSet = new Set()
    for (const subGroup of course.substitution_groups) {
      for (const sub of subGroup) subtitutionSet.add(sub)
    }

    const idToCodePairs = (
      await Course.findAll({
        attributes: ['id', 'code'],
        where: {
          id: { [Op.in]: Array.from(subtitutionSet) },
        },
        raw: true,
      })
    ).map(({ id, code }) => [id, code])
    const idToCodeMap = new Map(idToCodePairs)

    course.substitution_groups = course.substitution_groups
      .map(subGroup => subGroup.map(id => idToCodeMap.get(id)))
      .filter(sg => !sg.includes(undefined))

    course.mainCourseCode = [course.code, ...course.substitution_groups]
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
