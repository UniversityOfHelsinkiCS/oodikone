const { Op } = require('sequelize')
const { flatten, uniqBy, sortBy, groupBy, orderBy, has, get, uniq } = require('lodash')
const {
  Course,
  Student,
  SemesterEnrollment,
  Teacher,
  Credit,
  CreditTeacher,
  Transfer,
  CourseProvider,
} = require('../../db/models')
const { selectFromByIds, selectFromSnapshotsByIds, bulkCreate, getCourseUnitsByCodes } = require('../../db')
const { getEducation, getUniOrgId, getEducationType, loadMapsIfNeeded } = require('../shared')
const { studentMapper, mapTeacher, creditMapper, semesterEnrollmentMapper, courseProviderMapper } = require('../mapper')
const { dbConnections } = require('../../db/connection')
const { isBaMa } = require('../../utils')
const { updateStudyRights, updateStudyRightElements, updateElementDetails } = require('./studyRightUpdaters')
const { getAttainmentsToBeExcluded } = require('./excludedPartialAttainments')

// Check if studyright is degree leading or not
const studyRightHasDegreeEducation = studyRight => {
  const education = getEducation(studyRight.education_id)
  if (!education) return false
  const educationType = getEducationType(education.education_type)
  if (!educationType) return false
  return !educationType.parent_id.startsWith('urn:code:education-type:non-degree-education')
}

// Accepted selection path is not available when degree programme doesn't have
// studytrack or major subject. This is a known bug on SIS and has been reported
// to funidata.
// In these cases, degree programmes module group id must be fetched from education.
const addSelectionPathIfNeeded = snapshot =>
  Object.keys(snapshot.accepted_selection_path).length === 0
    ? {
        ...snapshot,
        accepted_selection_path: {
          educationPhase1GroupId: getEducation(snapshot.education_id).structure.phase1.options[0].moduleGroupId,
        },
      }
    : snapshot

// Parse useful snapshots from the whole list and enrich snapshots when needed
const parseStudyrightSnapshots = studyrightSnapshots =>
  studyrightSnapshots.reduce((parsed, current) => {
    if (current.document_state !== 'ACTIVE') return parsed
    if (!studyRightHasDegreeEducation(current)) return parsed
    parsed.push(addSelectionPathIfNeeded(current))
    return parsed
  }, [])

// Group snapshots by studyright id and find out when studyrights have begun
const groupStudyrightSnapshots = studyrightSnapshots => {
  const snapshotsBystudyright = Object.entries(groupBy(studyrightSnapshots, 'id'))

  return snapshotsBystudyright.reduce((res, [id, snapshots]) => {
    const byPhases = s => {
      const phase1 = s.accepted_selection_path.educationPhase1GroupId
      const phase2 = s.accepted_selection_path.educationPhase2GroupId
        ? s.accepted_selection_path.educationPhase2GroupId
        : 'none'
      return `${phase1}-${phase2}`
    }

    const orderedSnapshots = orderBy(
      snapshots,
      [s => new Date(s.snapshot_date_time), s => Number(s.modification_ordinal)],
      ['desc', 'desc']
    )

    const groupedByPhases = groupBy(orderedSnapshots, byPhases)

    // Get snapshot date time from oldest snapshot where date time is available. If no date
    // times are available (e.g. all are null), take study start date of the oldest one
    const parseSnapshotDateTime = snapshots => {
      let oldestFirst = [...snapshots]
      oldestFirst.reverse()
      const firstWithSnapshotDateTime = oldestFirst.find(s => !!s.snapshot_date_time)
      if (firstWithSnapshotDateTime) return firstWithSnapshotDateTime.snapshot_date_time
      return oldestFirst[0].study_start_date
    }

    const snapshotsWithRightDate = Object.keys(groupedByPhases).map(key => {
      const snapshots = groupedByPhases[key]
      const most_recent = snapshots[0]
      most_recent.first_snapshot_date_time = parseSnapshotDateTime(snapshots)
      return most_recent
    })

    res[id] = snapshotsWithRightDate

    return res
  }, {})
}

const parseTransfers = async (groupedStudyRightSnapshots, moduleGroupIdToCode, personIdToStudentNumber) => {
  const getTransfersFrom = (orderedSnapshots, studyrightid, educationId) => {
    return orderedSnapshots.reduce((curr, snapshot, i) => {
      if (i === 0) return curr

      const studyRightEducation = getEducation(educationId)
      if (!studyRightEducation) return curr

      const usePhase2 =
        isBaMa(studyRightEducation) && !!get(orderedSnapshots[i - 1], 'study_right_graduation.phase1GraduationDate')

      if (usePhase2 && !get(orderedSnapshots[i - 1], 'accepted_selection_path.educationPhase2GroupId')) return curr

      const mappedId = isBaMa(studyRightEducation)
        ? usePhase2 && !!get(snapshot, 'accepted_selection_path.educationPhase2GroupId')
          ? `${studyrightid}-2`
          : `${studyrightid}-1`
        : `${studyrightid}-1` // studyrightid duplicatefix

      const sourcecode =
        moduleGroupIdToCode[
          orderedSnapshots[i - 1].accepted_selection_path[
            usePhase2 ? 'educationPhase2GroupId' : 'educationPhase1GroupId'
          ]
        ]

      const targetcode =
        moduleGroupIdToCode[
          snapshot.accepted_selection_path[
            usePhase2 && has(snapshot, 'accepted_selection_path.educationPhase2GroupId')
              ? 'educationPhase2GroupId'
              : 'educationPhase1GroupId'
          ]
        ]

      if (!sourcecode || !targetcode || sourcecode === targetcode) return curr
      // source === targetcode isn't really a change between programmes, but we should still update transferdate to
      // newer snapshot date time
      // but: updating requires some changes to this reducers logic, so this fix can be here for now

      curr.push({
        id: `${mappedId}-${snapshot.modification_ordinal}-${sourcecode}-${targetcode}`,
        sourcecode,
        targetcode,
        transferdate: new Date(snapshot.snapshot_date_time),
        studentnumber: personIdToStudentNumber[snapshot.person_id],
        studyrightid: mappedId,
      })

      return curr
    }, [])
  }

  const transfers = []
  Object.values(groupedStudyRightSnapshots).forEach(snapshots => {
    const orderedSnapshots = orderBy(snapshots, s => new Date(s.snapshot_date_time), 'asc')
    transfers.push(...getTransfersFrom(orderedSnapshots, snapshots[0].id, snapshots[0].education_id))
  })
  return transfers
}

const updateStudents = async personIds => {
  await loadMapsIfNeeded()

  const [students, studyrightSnapshots, attainments, termRegistrations, studyRightPrimalities] = await Promise.all([
    selectFromByIds('persons', personIds),
    selectFromByIds('studyrights', personIds, 'person_id'),
    selectFromByIds('attainments', personIds, 'person_id'),
    selectFromByIds('term_registrations', personIds, 'student_id'),
    selectFromByIds('study_right_primalities', personIds, 'student_id'),
  ])

  const parsedStudyrightSnapshots = parseStudyrightSnapshots(studyrightSnapshots)

  const groupedStudyRightSnapshots = groupStudyrightSnapshots(parsedStudyrightSnapshots)

  const personIdToStudentNumber = students.reduce((res, curr) => {
    res[curr.id] = curr.student_number
    return res
  }, {})

  const personIdToStudyRightIdToPrimality = studyRightPrimalities.reduce((res, curr) => {
    if (!res[curr.student_id]) res[curr.student_id] = {}
    res[curr.student_id][curr.study_right_id] = curr
    return res
  }, {})

  const attainmentsToBeExluced = getAttainmentsToBeExcluded()

  const mappedStudents = students.map(studentMapper(attainments, parsedStudyrightSnapshots, attainmentsToBeExluced))
  await bulkCreate(Student, mappedStudents)

  const [moduleGroupIdToCode, formattedStudyRights] = await Promise.all([
    updateElementDetails(flatten(Object.values(groupedStudyRightSnapshots))),
    updateStudyRights(groupedStudyRightSnapshots, personIdToStudentNumber, personIdToStudyRightIdToPrimality),
  ])

  const mappedTransfers = await parseTransfers(groupedStudyRightSnapshots, moduleGroupIdToCode, personIdToStudentNumber)

  await Promise.all([
    updateStudyRightElements(
      groupedStudyRightSnapshots,
      moduleGroupIdToCode,
      personIdToStudentNumber,
      formattedStudyRights,
      mappedTransfers
    ),
    updateAttainments(attainments, personIdToStudentNumber, attainmentsToBeExluced),
    updateTermRegistrations(termRegistrations, personIdToStudentNumber),
    await bulkCreate(Transfer, mappedTransfers, null, ['studyrightid']),
  ])
}

const updateAttainments = async (attainments, personIdToStudentNumber, attainmentsToBeExluced) => {
  await updateTeachers(attainments)
  const [courseUnits, modules, studyrights] = await Promise.all([
    selectFromByIds(
      'course_units',
      attainments.map(a => a.course_unit_id).filter(id => !!id)
    ),
    selectFromByIds(
      'modules',
      attainments.map(a => a.module_group_id).filter(id => !!id),
      'group_id'
    ),
    selectFromByIds(
      'studyrights',
      attainments.map(a => a.study_right_id).filter(id => !!id)
    ),
  ])

  const [studyrightOrganisations] = await Promise.all([
    selectFromByIds(
      'organisations',
      studyrights.map(studyright => studyright.organisation_id).filter(id => !!id)
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

  const organisationIdToName = studyrightOrganisations.reduce((res, curr) => {
    res[curr.id] = curr.name
    return res
  }, {})

  const studyrightIdToOrganisationsName = studyrights.reduce((res, curr) => {
    res[curr.id] = organisationIdToName[curr.organisation_id]
    return res
  }, {})

  const idsOfFaculties = dbConnections.knex
    .select('id')
    .from('organisations')
    .where('parent_id', 'hy-university-root-id')

  const idsOfDegreeProgrammes = new Set(
    await dbConnections.knex
      .select('id')
      .from('organisations')
      .whereIn('parent_id', idsOfFaculties)
      .map(org => org.id)
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

  const courseCodeToAyCodelessId = new Map()

  const coursesToBeCreated = new Map()
  const coursesToBeUpdated = new Map()
  const courseProvidersToBeCreated = []

  // because of AY-codeless open uni courses
  const fixAyCodelessOpenUniCourses = async (attainments, sisDbCoursesForStudentAttainments) => {
    const groupIdsWithOpenUnStudyright = attainments.reduce((res, curr) => {
      if (curr.study_right_id !== null && curr.type === 'CourseUnitAttainment') {
        const organisationName = studyrightIdToOrganisationsName[curr.study_right_id]
        if (organisationName) {
          if (organisationName['fi'].startsWith('Avoin yliopisto')) {
            res.push(courseUnitIdToCourseGroupId[curr.course_unit_id])
          }
        }
      }
      return res
    }, [])

    const coursesWithNoAyCodeAndOpenUniStudyright = groupIdsWithOpenUnStudyright.reduce((res, curr) => {
      const foundCourse = sisDbCoursesForStudentAttainments.find(c => c.id === curr)
      if (foundCourse) {
        if (!foundCourse.code.startsWith('AY')) {
          res.push(foundCourse)
        }
      }
      return res
    }, [])

    const coursesWithAyCodeAlreadyExist = await Course.findAll({
      raw: true,
      where: {
        code: {
          [Op.in]: Object.values(coursesWithNoAyCodeAndOpenUniStudyright.map(c => 'AY'.concat(c.code))),
        },
      },
    })

    for (const course of coursesWithNoAyCodeAndOpenUniStudyright) {
      const courseWithIdForAyCodeExist = coursesWithAyCodeAlreadyExist.find(
        c => c.code === 'AY'.concat(course.code) && !c.id.endsWith('-ay')
      )

      if (courseWithIdForAyCodeExist) {
        const latest_instance_date = getFirstDateIfIsAfter(
          course.latest_instance_date,
          courseWithIdForAyCodeExist.latest_instance_date
        )
        const max_attainment_date = getFirstDateIfIsAfter(
          course.max_attainment_date,
          courseWithIdForAyCodeExist.max_attainment_date
        )
        const min_attainment_date = getFirstDateIfIsBefore(
          course.min_attainment_date,
          courseWithIdForAyCodeExist.min_attainment_date
        )

        if (latest_instance_date || max_attainment_date || min_attainment_date) {
          coursesToBeUpdated.set(courseWithIdForAyCodeExist.code, {
            ...courseWithIdForAyCodeExist,
            latest_instance_date: latest_instance_date,
            max_attainment_date: max_attainment_date,
            min_attainment_date: min_attainment_date,
          })
        }

        courseCodeToAyCodelessId.set('AY'.concat(course.code), courseWithIdForAyCodeExist.id)
      } else {
        coursesToBeCreated.set('AY'.concat(course.code), {
          ...course.dataValues,
          id: course.id.concat('-ay'),
          code: 'AY'.concat(course.code),
          substitutions: [course.id],
        })

        const subs = [...course.substitutions, course.id.concat('-ay')]
        coursesToBeUpdated.set(course.code, {
          ...course.dataValues,
          substitutions: subs,
        })

        courseCodeToAyCodelessId.set('AY'.concat(course.code), course.id.concat('-ay'))
        const courseProvider = await CourseProvider.findOne({
          where: {
            coursecode: `${course.id}-ay`,
          },
        })

        if (!courseProvider) {
          const mapCourseProvider = courseProviderMapper(course.id.concat('-ay'))
          courseProvidersToBeCreated.push(mapCourseProvider({ organisationId: 'hy-org-48645785' }))
        }
      }
    }
  }

  await fixAyCodelessOpenUniCourses(attainments, sisDbCoursesForStudentAttainments)

  // This mayhem fixes missing course_unit references for CustomCourseUnitAttainments.
  const fixCustomCourseUnitAttainments = async attainments => {
    const addCourseUnitToCustomCourseUnitAttainments = (courses, attIdToCourseCode) => async att => {
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
              o.roleUrn == 'urn:code:organisation-role:responsible-organisation'
          )
          if (correctProvider) {
            courseProvidersToBeCreated.push(mapCourseProvider(correctProvider))
          }
        }

        courseUnit = course ? course : { id: parsedCourseCode, code: parsedCourseCode }
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
      if (codeParts.length === 1) parsedCourseCode = codeParts[0]
      else {
        if (codeParts[1].length < 7) {
          parsedCourseCode = `${codeParts[0]}-${codeParts[1]}`
        } else {
          parsedCourseCode = codeParts[0]
        }
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
    studyrightIdToOrganisationsName,
    courseCodeToAyCodelessId
  )

  const credits = fixedAttainments
    .filter(a => a !== null)
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
  const coursesUpdate = Array.from(coursesToBeUpdated.values())
  await bulkCreate(Course, courses)
  await bulkCreate(Credit, credits)
  await bulkCreate(
    CreditTeacher,
    uniqBy(creditTeachers, cT => cT.composite),
    null,
    ['composite']
  )
  await bulkCreate(
    CourseProvider,
    uniqBy(courseProvidersToBeCreated, cP => cP.composite),
    null,
    ['composite']
  )
  await bulkCreate(Course, coursesUpdate)
}

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

// why we are using two terms for the same thing: term registration and semester enrollment
const semesterEnrolmentsOfStudent = allSementerEnrollments => {
  const semesters = uniq(allSementerEnrollments.map(s => s.semestercode))
  const semesterEnrollments = semesters.map(semester => {
    const enrolmentsForSemster = allSementerEnrollments.filter(se => se.semestercode === semester)

    const present = enrolmentsForSemster.find(se => se.enrollmenttype === 1)
    if (present) {
      return present
    }
    const absent = enrolmentsForSemster.find(se => se.enrollmenttype === 2)
    if (absent) {
      return absent
    }

    return enrolmentsForSemster[0]
  })

  return semesterEnrollments
}

const updateTermRegistrations = async (termRegistrations, personIdToStudentNumber) => {
  const studyRightIds = termRegistrations.map(({ study_right_id }) => study_right_id)
  const studyRights = await selectFromSnapshotsByIds('studyrights', studyRightIds)

  const studyrightToUniOrgId = studyRights.reduce((res, curr) => {
    res[curr.id] = getUniOrgId(curr.organisation_id)
    return res
  }, {})

  const mapSemesterEnrollment = semesterEnrollmentMapper(personIdToStudentNumber, studyrightToUniOrgId)

  const allSementerEnrollments = flatten(
    termRegistrations
      .filter(t => studyRights.some(r => r.id === t.study_right_id))
      .map(({ student_id, term_registrations, study_right_id }) =>
        term_registrations.map(mapSemesterEnrollment(student_id, study_right_id))
      )
  )

  const enrolmentsByStudents = groupBy(allSementerEnrollments, e => e.studentnumber)
  const semesterEnrollments = flatten(Object.values(enrolmentsByStudents).map(semesterEnrolmentsOfStudent))

  await bulkCreate(SemesterEnrollment, semesterEnrollments)
}

const getFirstDateIfIsAfter = (dateOne, dateTwo) => {
  const isAfter = new Date(dateOne) > new Date(dateTwo) ? dateOne : dateTwo
  if (isAfter) {
    return dateOne
  } else {
    return null
  }
}

const getFirstDateIfIsBefore = (dateOne, dateTwo) => {
  const isAfter = new Date(dateOne) < new Date(dateTwo) ? dateOne : dateTwo
  if (isAfter) {
    return dateOne
  } else {
    return null
  }
}

module.exports = {
  updateStudents,
}
