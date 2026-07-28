import { uniqBy, groupBy } from 'lodash-es'
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

const updateCourses = async (courseIdToAttainments, groupIdToCourse) => {
  const courseProviders = []
  const mappedCourses = []

  const mapCourse = courseMapper(courseIdToAttainments)

  for (const [groupId, courses] of Object.entries(groupIdToCourse)) {
    const now = new Date()
    const { id: primaryCourseId } = courses.reduce(
      (acc, cur) => {
        const start = new Date(cur.validity_period.startDate)
        if (start > acc.startDate && start < now) {
          acc.id = cur.id
          acc.startDate = start
        }
        return acc
      },
      { startDate: new Date(0), id: courses[0].id }
    )

    for (const course of courses) {
      /** @type string[][] @description nested arrays of courseUnit groupIds. Modules have no substitutions. */
      const substitutionGroups = course.substitutions?.map(subGroup => subGroup.map(sub => sub.courseUnitGroupId)) ?? []

      const organisationsById = {}
      const { organisations, validity_period: courseValidityPeriod } = course

      if (organisations) {
        for (const { share, organisationId, roleUrn, validityPeriod: orgValidityPeriod } of organisations) {
          if (roleUrn !== 'urn:code:organisation-role:responsible-organisation') continue

          // OrgValidityPeriod is never defined in importer? Leaving it, as it doesn't matter because of the fallback.
          const { startDate, endDate } = orgValidityPeriod ?? courseValidityPeriod ?? {}

          organisationsById[organisationId] ??= { organisationId, roleUrn, shares: [] }
          organisationsById[organisationId].shares.push({
            share,
            ...(startDate && { startDate }),
            ...(endDate && { endDate }),
          })
        }
      }

      const mapCourseProvider = courseProviderMapper(groupId)

      courseProviders.push(...Object.values(organisationsById).map(mapCourseProvider))
      mappedCourses.push(mapCourse(groupId, course, substitutionGroups, primaryCourseId))
    }
  }

  // console.log('Creating:')
  // console.dir(mappedCourses, { depth: null })
  await bulkCreate(Course, mappedCourses)
  await bulkCreate(
    CourseProvider,
    uniqBy(courseProviders, cP => `${cP.coursecode}-${cP.organizationcode}`),
    null,
    ['coursecode', 'organizationcode']
  )
}

export const updateStudyModules = async studyModules => {
  const organizationStudyModules = studyModules.filter(s => s.university_org_ids.includes(rootOrgId))
  // Attainments are later assumed to be sorted
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
  // Attainments are later assumed to be sorted
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
