import { flatten, sortBy, uniqBy } from 'lodash-es'
import { rootOrgId } from '../../config.js'
import { dbConnections } from '../../db/connection.js'
import { selectFromByIds, bulkCreate, selectOneById } from '../../db/index.js'
import { Course, Teacher, Credit, CreditTeacher, CourseProvider } from '../../db/models/index.js'
import {
  mapTeacher,
  creditMapper,
  courseProviderMapper,
  validAttainmentTypes,
  customAttainmentTypes,
  isModule,
} from '../mapper.js'

const updateTeachers = async attainments => {
  const acceptorPersonIds = flatten(
    attainments.map(attainment =>
      attainment.acceptor_persons
        .filter(p => p.roleUrn === 'urn:code:attainment-acceptor-type:approved-by')
        .map(p => p.personId)
    )
  ).filter(p => !!p)

  const teachers = (await selectFromByIds('persons', acceptorPersonIds)).map(p => mapTeacher(p))

  // Sort to avoid deadlocks
  await bulkCreate(Teacher, sortBy(teachers, ['id']))
}

export const updateAttainments = async (
  attainments,
  personIdToStudentNumber,
  attainmentsToBeExluced,
  studyRightIdToEducationType
) => {
  await updateTeachers(attainments)

  const { cuIds, modGroupIds } = attainments.reduce(
    (acc, { course_unit_id, module_group_id }) => {
      if (course_unit_id) {
        acc.cuIds.push(course_unit_id)
      }
      if (module_group_id) {
        acc.modGroupIds.push(module_group_id)
      }
      return acc
    },
    { cuIds: [], modGroupIds: [] }
  )

  const [courseUnits, modules] = await Promise.all([
    dbConnections.knex('course_units').select(['id', 'code']).whereIn('id', cuIds),
    dbConnections.knex('modules').select(['group_id', 'code']).whereIn('group_id', modGroupIds),
  ])

  const courseUnitIdToCourseCode = courseUnits.reduce((res, cu) => {
    res[cu.id] = cu.code
    return res
  }, {})

  const moduleGroupIdToModuleCode = modules.reduce((res, module) => {
    res[module.group_id] = module.code
    return res
  }, {})

  const idsOfFaculties = dbConnections.knex.select('id').from('organisations').where('parent_id', rootOrgId)

  const idsOfDegreeProgrammes = new Set(
    (await dbConnections.knex.select('id').from('organisations').whereIn('parent_id', idsOfFaculties)).map(
      org => org.id
    )
  )

  const creditTeachers = []

  const coursesToBeCreated = new Map()
  const courseProvidersToBeCreated = []

  // This mayhem fixes missing course_unit references for CustomCourseUnitAttainments.
  const fixCustomCourseUnitAttainments = async attainments => {
    const addCourseUnitToCustomCourseUnitAttainments = (courses, attIdToCourseCode) => async att => {
      if (att.module_group_id) {
        const studyModule = await selectOneById('modules', att.module_group_id, 'group_id')

        // Sometimes attainments point to a module that does not exist in db. likely because
        // the module document_state is "DRAFT", and thus dropped by importer. (see for example issue #4761)
        if (!studyModule) {
          if (att.module_group_id === 'hy-SM-89304486') {
            const course = await Course.findOne({ attributes: ['id'], where: { code: '71066' }, raw: true })
            return { ...att, module_group_id: course.id }
          }
          if (att.module_group_id === 'hy-SM-100017957') {
            const course = await Course.findOne({ attributes: ['id'], where: { code: '523102' }, raw: true })
            return { ...att, module_group_id: course.id }
          }
          const education = await selectOneById('educations', att.module_group_id.replace('DP', 'EDU'))

          if (education) {
            coursesToBeCreated.set(education.code, {
              id: att.module_group_id,
              groupId: att.module_group_id,
              isPrimary: true,
              isStudyModule: isModule(att.type),
              name: education.name,
              code: education.code,
              coursetypecode: att.study_level_urn,
              courseUnitType: att.course_unit_type_urn,
              substitutionGroups: [],
            })
            return att
          }

          coursesToBeCreated.set(att.module_group_id, {
            id: att.module_group_id,
            groupId: att.module_group_id,
            isPrimary: true,
            isStudyModule: isModule(att.type),
            name: {
              fi: 'Tuntematon opintokokonaisuus',
              en: 'Unknown study module',
              sv: 'Okänd studiehelhet',
            },
            code: att.module_group_id,
            coursetypecode: att.study_level_urn,
            courseUnitType: att.course_unit_type_urn,
            substitutionGroups: [],
          })
          return att
        }
      }

      if (!customAttainmentTypes.includes(att.type)) return att
      let courseUnit
      const courseUnits = courses.filter(course => course.code === attIdToCourseCode[att.id])

      const isAfterStartAndBeforeEnd = (startDate, endDate, date) => {
        const dateToCompare = new Date(date)
        return new Date(startDate) <= dateToCompare && (!endDate || dateToCompare < new Date(endDate))
      }

      courseUnit = courseUnits.find(({ validity_period }) =>
        isAfterStartAndBeforeEnd(validity_period.startDate, validity_period.endDate, att.attainment_date)
      )

      // Sometimes registrations are fakd, see attainment hy-opinto-141561630.
      // The attainmentdate is outside of all courses, yet should be mapped.
      // Try to catch suitable courseUnit for this purpose
      if (!courseUnit) {
        courseUnit = courseUnits.find(({ validity_period }) =>
          isAfterStartAndBeforeEnd(validity_period.startDate, validity_period.endDate, att.registration_date)
        )
      }

      let courseProvider
      let course

      // If there's no suitable courseunit, there isn't courseunit available at all.
      // --> Course should be created, if it doesn't exist in sis db
      if (!courseUnit) {
        const parsedCourseCode = attIdToCourseCode[att.id]

        // see if course exists
        course = await Course.findOne({ where: { code: parsedCourseCode, id: parsedCourseCode }, raw: true })

        // If course doesn't exist, create it
        if (!course) {
          courseUnit = {
            id: parsedCourseCode,
            groupId: parsedCourseCode,
            isPrimary: true,
            name: att.name,
            code: parsedCourseCode,
            isStudyModule: isModule(att.type),
            coursetypecode: att.study_level_urn,
            maxAttainmentDate: att.attainment_date,
            minAttainmentDate: att.attainment_date,
            substitutionGroups: [],
            courseUnitType: att.course_unit_type_urn,
          }

          coursesToBeCreated.set(parsedCourseCode, courseUnit)
          courseProvider = await CourseProvider.findOne({
            where: {
              coursecode: parsedCourseCode,
            },
          })
        }

        const courseIdToUse = attIdToCourseCode[att.id]

        // If there's no courseprovider, try to create course provider
        if (!courseProvider) {
          const mapCourseProvider = courseProviderMapper(courseIdToUse)

          // Only map provider if it is responsible and it is degree programme
          const correctProvider = att.organisations.find(
            o =>
              idsOfDegreeProgrammes.has(o.organisationId) &&
              o.roleUrn === 'urn:code:organisation-role:responsible-organisation'
          )
          if (correctProvider) {
            courseProvidersToBeCreated.push(mapCourseProvider(correctProvider))
          }
        }

        courseUnit = course || { id: courseIdToUse, code: courseIdToUse }
        courseUnit.group_id = courseUnit.id
      }

      // Add the CU to the mapping objects for creditMapper to work properly.
      courseUnitIdToCourseCode[courseUnit.id] = courseUnit.code

      return { ...att, course_unit_id: courseUnit.id }
    }

    const findMissingCourseCodes = (attainmentIdCodeMap, att) => {
      if (!customAttainmentTypes.includes(att.type) || !att.code) {
        return attainmentIdCodeMap
      }

      const codeParts = att.code.split('-')
      if (!codeParts.length) return attainmentIdCodeMap

      const parsedCourseCode = codeParts[1]?.length < 7 ? `${codeParts[0]}-${codeParts[1]}` : codeParts[0]

      attainmentIdCodeMap[att.id] = parsedCourseCode
      return attainmentIdCodeMap
    }

    const attainmentIdCourseCodeMapForCustomCourseUnitAttainments = attainments.reduce(findMissingCourseCodes, {})
    const missingCodes = Object.values(attainmentIdCourseCodeMapForCustomCourseUnitAttainments)
    const courses = await selectFromByIds('course_units', missingCodes, 'code')
    return await Promise.all(
      attainments.map(
        addCourseUnitToCustomCourseUnitAttainments(courses, attainmentIdCourseCodeMapForCustomCourseUnitAttainments)
      )
    )
  }

  const fixedAttainments = await fixCustomCourseUnitAttainments(attainments)

  // If an attainment has been attached to two degrees, a duplicate custom attainment is made for it. This duplicate
  // should not show in the students attainments
  const doubleAttachment = (att, attainments) => {
    if (!customAttainmentTypes.includes(att.type) && att.state !== 'INCLUDED') {
      return false
    }

    let isDoubleAttachment = false
    const idParts = att.id.split('-')
    if (idParts && idParts.length > 3) {
      const originalId = `${idParts[0]}-${idParts[1]}-${idParts[2]}`
      isDoubleAttachment = attainments.some(
        a => originalId === a.id && String(a.attainment_date) === String(att.attainment_date)
      )
    }

    return isDoubleAttachment
  }

  const mapCredit = creditMapper(
    personIdToStudentNumber,
    courseUnitIdToCourseCode,
    moduleGroupIdToModuleCode,
    studyRightIdToEducationType
  )

  const credits = []

  for (const attainment of fixedAttainments) {
    if (
      !attainment?.id ||
      !validAttainmentTypes.includes(attainment.type) ||
      attainment.misregistration ||
      doubleAttachment(attainment, fixedAttainments)
    ) {
      continue
    }

    const mappedCredit = mapCredit(attainment)
    if (mappedCredit) {
      for (const person of attainment.acceptor_persons) {
        if (person.roleUrn === 'urn:code:attainment-acceptor-type:approved-by' && person.personId) {
          const teacher = await Teacher.findOne({ where: { id: person.personId }, raw: true })
          if (teacher) {
            creditTeachers.push({
              credit_id: attainment.id,
              teacher_id: person.personId,
            })
          }
        }
      }
      credits.push(mappedCredit)
    }
  }

  const courses = Array.from(coursesToBeCreated.values())

  await bulkCreate(Course, courses)
  await bulkCreate(Credit, credits.filter(Boolean))
  await bulkCreate(
    CreditTeacher,
    uniqBy(creditTeachers, cT => `${cT.credit_id}-${cT.teacher_id}`),
    null,
    ['credit_id', 'teacher_id']
  )
  await bulkCreate(
    CourseProvider,
    uniqBy(courseProvidersToBeCreated, cP => `${cP.coursecode}-${cP.organizationcode}`),
    null,
    ['coursecode', 'organizationcode']
  )
}
