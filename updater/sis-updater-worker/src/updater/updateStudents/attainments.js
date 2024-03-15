const _ = require('lodash')
const { Op } = require('sequelize')

const { Course, Teacher, Credit, CreditTeacher, CourseProvider } = require('../../db/models')
const { selectFromByIds, bulkCreate, getCourseUnitsByCodes } = require('../../db')
const { mapTeacher, creditMapper, courseProviderMapper } = require('../mapper')
const { dbConnections } = require('../../db/connection')

const updateTeachers = async attainments => {
  const acceptorPersonIds = _.flatten(
    attainments.map(attainment =>
      attainment.acceptor_persons
        .filter(p => p.roleUrn === 'urn:code:attainment-acceptor-type:approved-by')
        .map(p => p.personId)
    )
  ).filter(p => !!p)

  const teachers = (await selectFromByIds('persons', acceptorPersonIds)).map(p => mapTeacher(p))

  // Sort to avoid deadlocks
  await bulkCreate(Teacher, _.sortBy(teachers, ['id']))
}

const updateAttainments = async (
  attainments,
  personIdToStudentNumber,
  attainmentsToBeExluced,
  studyRightIdToEducationType
) => {
  await updateTeachers(attainments)
  const [courseUnits, modules] = await Promise.all([
    selectFromByIds(
      'course_units',
      attainments.map(a => a.course_unit_id).filter(id => !!id)
    ),
    selectFromByIds(
      'modules',
      attainments.map(a => a.module_group_id).filter(id => !!id),
      'group_id'
    ),
  ])

  const courseUnitIdToCourseGroupId = courseUnits.reduce((res, curr) => {
    res[curr.id] = curr.group_id
    return res
  }, {})

  const moduleGroupIdToModuleCode = modules.reduce((res, curr) => {
    res[curr.group_id] = curr.code
    return res
  }, {})

  const idsOfFaculties = dbConnections.knex
    .select('id')
    .from('organisations')
    .where('parent_id', 'hy-university-root-id')

  const idsOfDegreeProgrammes = new Set(
    (await dbConnections.knex.select('id').from('organisations').whereIn('parent_id', idsOfFaculties)).map(
      org => org.id
    )
  )

  const sisDbCoursesForStudentAttainments = await Course.findAll({
    where: {
      id: {
        [Op.in]: Object.values(courseUnitIdToCourseGroupId),
      },
    },
  })

  const courseGroupIdToCourseCode = sisDbCoursesForStudentAttainments.reduce((res, curr) => {
    res[curr.id] = curr.code
    return res
  }, {})

  const properAttainmentTypes = new Set([
    'CourseUnitAttainment',
    'ModuleAttainment',
    'DegreeProgrammeAttainment',
    'CustomCourseUnitAttainment',
    'CustomModuleAttainment',
  ])
  const creditTeachers = []

  const coursesToBeCreated = new Map()
  const courseProvidersToBeCreated = []

  // These modules cause problems, if credits are updated
  const modulesNotAvailable = [
    'hy-DP-65295180-ma',
    'hy-DP-141512970',
    'hy-DP-141513052',
    'hy-SM-89304486',
    'hy-SM-96923271',
    'hy-SM-100017957',
    'hy-SM-93788863',
  ]
  // This mayhem fixes missing course_unit references for CustomCourseUnitAttainments.
  const fixCustomCourseUnitAttainments = async attainments => {
    const addCourseUnitToCustomCourseUnitAttainments = (courses, attIdToCourseCode) => async att => {
      // Fix attainments with missing modules
      if (modulesNotAvailable.includes(att.module_group_id) || modulesNotAvailable.includes(att.module_id)) {
        if (att.module_group_id === 'hy-SM-89304486') {
          const course = await Course.findOne({ where: { code: '71066' } })
          return { ...att, module_group_id: course.id }
        }
        if (att.module_group_id === 'hy-SM-100017957') {
          const course = await Course.findOne({ where: { code: '523102' } })
          return { ...att, module_group_id: course.id }
        }
        if (['hy-DP-65295180-ma', 'hy-DP-141512970', 'hy-DP-141513052'].includes(att.module_group_id)) {
          const education = await selectFromByIds('educations', [att.module_group_id.replace('DP', 'EDU')])
          if (education.length > 0) {
            coursesToBeCreated.set(education[0].code, {
              id: att.module_group_id,
              name: education[0].name,
              code: education[0].code,
              main_course_code: education[0].code,
              coursetypecode: att.study_level_urn,
              course_unit_type: att.course_unit_type_urn,
              substitutions: [],
            })
            return att
          }
        }
        coursesToBeCreated.set(att.module_group_id, {
          id: att.module_group_id,
          name: {
            fi: 'Tuntematon opintokokonaisuus',
            en: 'Unknown study module',
            sv: 'Okänd studiehelhet',
          },
          code: att.module_group_id,
          main_course_code: att.module_group_id,
          coursetypecode: att.study_level_urn,
          course_unit_type: att.course_unit_type_urn,
          substitutions: [],
        })
        return att
      }

      if (att.type !== 'CustomCourseUnitAttainment' && att.type !== 'CustomModuleAttainment') return att
      const courseUnits = courses.filter(c => c.code === attIdToCourseCode[att.id])
      let courseUnit = courseUnits.find(cu => {
        const { startDate, endDate } = cu.validity_period
        const attainment_date = new Date(att.attainment_date)

        const isAfterStart = new Date(startDate) <= attainment_date
        const isBeforeEnd = !endDate || new Date(endDate) > attainment_date

        return isAfterStart && isBeforeEnd
      })

      // Sometimes registrations are fakd, see attainment hy-opinto-141561630.
      // The attainmentdate is outside of all courses, yet should be mapped.
      // Try to catch suitable courseUnit for this purpose
      if (!courseUnit) {
        courseUnit = courseUnits.find(cu => {
          const { startDate, endDate } = cu.validity_period
          const date = new Date(att.registration_date)

          const isAfterStart = new Date(startDate) <= date
          const isBeforeEnd = !endDate || new Date(endDate) > date

          return isAfterStart && isBeforeEnd
        })
      }

      // If there's no suitable courseunit, there isn't courseunit available at all.
      // --> Course should be created, if it doesn't exist in sis db
      if (!courseUnit) {
        const parsedCourseCode = attIdToCourseCode[att.id]
        // see if course exists
        const course = await Course.findOne({
          where: {
            code: parsedCourseCode,
          },
        })

        // If course doesn't exist, create it
        if (!course) {
          coursesToBeCreated.set(parsedCourseCode, {
            id: parsedCourseCode,
            name: att.name,
            code: parsedCourseCode,
            coursetypecode: att.study_level_urn,
            course_unit_type: att.course_unit_type_urn,
          })
        }

        // see if course has provider
        const courseProvider = await CourseProvider.findOne({
          where: {
            coursecode: course ? course.id : parsedCourseCode,
          },
        })

        // If there's no courseprovider, try to create course provider
        if (!courseProvider) {
          const mapCourseProvider = courseProviderMapper(parsedCourseCode)

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

        courseUnit = course || { id: parsedCourseCode, code: parsedCourseCode }
        courseUnit.group_id = courseUnit.id
      }

      if (!courseUnit) return att
      // Add the course to the mapping objects for creditMapper to work properly.
      courseUnitIdToCourseGroupId[courseUnit.id] = courseUnit.group_id
      courseGroupIdToCourseCode[courseUnit.group_id] = courseUnit.code

      return { ...att, course_unit_id: courseUnit.id }
    }

    const findMissingCourseCodes = (attainmentIdCodeMap, att) => {
      if (att.type !== 'CustomCourseUnitAttainment' && att.type !== 'CustomModuleAttainment') {
        return attainmentIdCodeMap
      }
      if (!att.code) return attainmentIdCodeMap

      const codeParts = att.code.split('-')
      if (!codeParts.length) return attainmentIdCodeMap

      let parsedCourseCode = ''
      // eslint-disable-next-line prefer-destructuring
      if (codeParts.length === 1) parsedCourseCode = codeParts[0]
      else if (codeParts[1].length < 7) {
        parsedCourseCode = `${codeParts[0]}-${codeParts[1]}`
      } else {
        // eslint-disable-next-line prefer-destructuring
        parsedCourseCode = codeParts[0]
      }
      return { ...attainmentIdCodeMap, [att.id]: parsedCourseCode }
    }

    const attainmentIdCourseCodeMapForCustomCourseUnitAttainments = attainments.reduce(findMissingCourseCodes, {})
    const missingCodes = Object.values(attainmentIdCourseCodeMapForCustomCourseUnitAttainments)
    const courses = await getCourseUnitsByCodes(missingCodes)
    return await Promise.all(
      attainments.map(
        addCourseUnitToCustomCourseUnitAttainments(courses, attainmentIdCourseCodeMapForCustomCourseUnitAttainments)
      )
    )
  }

  const fixedAttainments = await fixCustomCourseUnitAttainments(attainments)

  const customTypes = new Set(['CustomModuleAttainment', 'CustomCourseUnitAttainment'])

  // If an attainment has been attached to two degrees, a duplicate custom attainment is made for it. This duplicate
  // should not show in the students attainments
  const doubleAttachment = (att, attainments) => {
    if (!customTypes.has(att.type) && att.state !== 'INCLUDED') {
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
    courseUnitIdToCourseGroupId,
    moduleGroupIdToModuleCode,
    courseGroupIdToCourseCode,
    studyRightIdToEducationType
  )

  const credits = fixedAttainments
    .filter(a => a !== null)
    .filter(a => a.id !== null)
    .filter(
      a =>
        properAttainmentTypes.has(a.type) &&
        !a.misregistration &&
        !attainmentsToBeExluced.has(a.id) &&
        !doubleAttachment(a, fixedAttainments)
    )
    .map(a => {
      a.acceptor_persons
        .filter(p => p.roleUrn === 'urn:code:attainment-acceptor-type:approved-by' && !!p.personId)
        .forEach(p => {
          creditTeachers.push({ composite: `${a.id}-${p.personId}`, credit_id: a.id, teacher_id: p.personId })
        })

      return mapCredit(a)
    })
    .filter(c => !!c)

  const courses = Array.from(coursesToBeCreated.values())
  await bulkCreate(Course, courses)
  await bulkCreate(Credit, credits)
  await bulkCreate(
    CreditTeacher,
    _.uniqBy(creditTeachers, cT => cT.composite),
    null,
    ['composite']
  )
  await bulkCreate(
    CourseProvider,
    _.uniqBy(courseProvidersToBeCreated, cP => cP.composite),
    null,
    ['composite']
  )
}

module.exports = {
  updateAttainments,
}
