const { Op } = require('sequelize')
const { flatten, uniqBy, sortBy, groupBy, orderBy, has, get, uniq, flattenDeep } = require('lodash')
const {
  Course,
  Student,
  SemesterEnrollment,
  Teacher,
  Credit,
  CreditTeacher,
  Transfer,
  CourseProvider,
  Enrollment,
  Studyplan,
} = require('../../db/models')
const {
  selectFromByIds,
  selectFromSnapshotsByIds,
  bulkCreate,
  getCourseUnitsByCodes,
  selectFromActiveSnapshotsByIds,
} = require('../../db')
const { getEducation, getUniOrgId, loadMapsIfNeeded } = require('../shared')
const {
  studentMapper,
  mapTeacher,
  creditMapper,
  semesterEnrollmentMapper,
  courseProviderMapper,
  enrollmentMapper,
  studyplanMapper,
  sanitizeCourseCode,
} = require('../mapper')
const { dbConnections } = require('../../db/connection')
const { isBaMa } = require('../../utils')
const { updateStudyRights, updateStudyRightElements, updateElementDetails } = require('./studyRightUpdaters')
const { getAttainmentsToBeExcluded } = require('./excludedPartialAttainments')
const { logger } = require('../../utils/logger')

// When updating students, studyplans sometimes are not updated. Check which aren't updated and redo the students
const studyplansRedo = async (personIds, personIdToStudentNumber, iteration = 0) => {
  if (iteration > 0) return
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const students = await Studyplan.findAll({
    where: {
      updatedAt: { [Op.lt]: yesterday },
      studentnumber: { [Op.in]: personIds.map(id => personIdToStudentNumber[id]) },
    },
    attributes: ['studentnumber'],
    distinct: true,
  })
  const studentNumberToPersonId = Object.entries(personIdToStudentNumber).reduce((obj, cur) => {
    const [personId, studentnumber] = cur
    obj[studentnumber] = personId
    return obj
  }, {})

  const studentNumbers = students.map(s => s.studentnumber)
  if (!studentNumbers.length) {
    return
  }

  logger.info(`Updating ${studentNumbers.length} students again due to studyplans not updating.`)
  await updateStudents(
    studentNumbers.map(num => studentNumberToPersonId[num]),
    iteration + 1
  )
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
      const oldestFirst = snapshots
        .filter(s => !!s.snapshot_date_time)
        .sort((a, b) => new Date(a.snapshot_date_time) - new Date(b.snapshot_date_time))
      if (oldestFirst.length) return oldestFirst[0].snapshot_date_time
      return null
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
        transferdate: new Date(snapshot.first_snapshot_date_time || snapshot.snapshot_date_time),
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

const updateStudents = async (personIds, iteration = 0) => {
  await loadMapsIfNeeded()

  const [
    students,
    studyrightSnapshots,
    attainments,
    termRegistrations,
    studyRightPrimalities,
    enrollments,
    studyplans,
  ] = await Promise.all([
    selectFromByIds('persons', personIds),
    selectFromByIds('studyrights', personIds, 'person_id'),
    selectFromByIds('attainments', personIds, 'person_id'),
    selectFromByIds('term_registrations', personIds, 'student_id'),
    selectFromByIds('study_right_primalities', personIds, 'student_id'),
    selectFromByIds('enrolments', personIds, 'person_id'),
    selectFromByIds('plans', personIds, 'user_id'),
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
  const mappedStudents = students
    .filter(s => s.student_number)
    .map(studentMapper(attainments, parsedStudyrightSnapshots, attainmentsToBeExluced))

  await bulkCreate(Student, mappedStudents)

  const [moduleGroupIdToCode, formattedStudyRights] = await Promise.all([
    updateElementDetails(flatten(Object.values(groupedStudyRightSnapshots))),
    updateStudyRights(
      groupedStudyRightSnapshots,
      personIdToStudentNumber,
      personIdToStudyRightIdToPrimality,
      termRegistrations
    ),
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
    updateEnrollments(enrollments, personIdToStudentNumber),
    updateStudyplans(studyplans, personIds, personIdToStudentNumber, groupedStudyRightSnapshots),
    bulkCreate(Transfer, mappedTransfers, null, ['studyrightid']),
  ])

  // Studyplans do not always update. These launch updateStudents again for those
  // whose studyplans weren't updated. Twice to see if it sometimes misses
  await studyplansRedo(personIds, personIdToStudentNumber, iteration)
}

const updateStudyplans = async (studyplansAll, personIds, personIdToStudentNumber, groupedStudyRightSnapshots) => {
  const studyplans = studyplansAll.filter(plan => plan.primary)
  const attainments = await selectFromByIds('attainments', personIds, 'person_id')
  const programmeModules = (
    await selectFromByIds(
      'modules',
      Array.from(new Set(flatten(studyplans.map(plan => plan.module_selections.map(module => module.moduleId)))))
    )
  ).concat(
    await selectFromByIds(
      'modules',
      attainments.map(a => a.module_group_id).filter(id => !!id),
      'group_id'
    )
  )
  const educationHasStudyRight = Object.keys(groupedStudyRightSnapshots).reduce((acc, k) => {
    const sorted = groupedStudyRightSnapshots[k]
      .filter(s => new Date(s.snapshot_date_time) <= new Date())
      .sort((a, b) => new Date(b.snapshot_date_time) - new Date(a.snapshot_date_time))
    if (!sorted.length) return acc
    const { education_id, person_id } = sorted[0]
    if (!acc[education_id]) acc[education_id] = {}
    acc[education_id][person_id] = true
    return acc
  }, {})

  const educationStudyrights = Object.keys(groupedStudyRightSnapshots).reduce((acc, k) => {
    const sorted = groupedStudyRightSnapshots[k]
      .filter(s => new Date(s.snapshot_date_time) <= new Date())
      .sort((a, b) => new Date(b.snapshot_date_time) - new Date(a.snapshot_date_time))
    if (!sorted.length) return acc
    const { education_id, person_id, id } = sorted[0]
    const educationType = getEducation(education_id)
    const hasBaMa = educationType && isBaMa(educationType)
    if (!acc[education_id]) acc[education_id] = {}
    acc[education_id][person_id] = {
      personId: person_id,
      studyRightId: id,
      hasBaMaEducation: hasBaMa,
    }
    return acc
  }, {})

  const filteredPlans = studyplans.filter(
    p => educationHasStudyRight[p.root_id] && educationHasStudyRight[p.root_id][p.user_id]
  )

  const courseUnitSelections = flatten(studyplans.map(plan => plan.course_unit_selections.map(cu => cu.courseUnitId)))
  const courseUnitSelectionSubstitutedBy = flattenDeep(
    studyplans.map(plan =>
      plan.course_unit_selections.filter(cu => cu.substitutedBy.length).map(cu => cu.substitutedBy.map(sub => sub))
    )
  )

  const courseUnits = await selectFromByIds(
    'course_units',
    Array.from(
      new Set(
        courseUnitSelections
          .concat(courseUnitSelectionSubstitutedBy)
          .concat(...attainments.filter(a => !!a.course_unit_id).map(a => a.course_unit_id))
      )
    )
  )

  const attainmentIdToAttainment = attainments.reduce((res, cur) => {
    res[cur.id] = cur
    return res
  }, {})

  const courseUnitIdToAttainment = attainments.reduce((res, cur) => {
    if (!cur.course_unit_id) return res
    if (!res[cur.course_unit_id]) res[cur.course_unit_id] = {}
    if (!res[cur.course_unit_id][cur.person_id]) res[cur.course_unit_id][cur.person_id] = []
    res[cur.course_unit_id][cur.person_id].push(cur)
    return res
  }, {})

  const moduleAttainments = attainments.reduce((res, attainment) => {
    if (!attainment.module_id) return res
    if (!res[attainment.module_id]) res[attainment.module_id] = {}
    res[attainment.module_id][attainment.person_id] = attainment
    return res
  }, {})

  const programmeModuleIdToType = programmeModules.reduce((res, cur) => {
    res[cur.id] = cur.type
    return res
  }, {})

  const programmeModuleIdToCode = programmeModules.reduce((res, cur) => {
    res[cur.id] = cur.code
    return res
  }, {})

  const programmeModuleGroupIdToCode = programmeModules.reduce((res, cur) => {
    res[cur.id] = cur.code
    return res
  }, {})

  const courseUnitIdToCode = courseUnits.reduce((res, cur) => {
    res[cur.id] = cur.code
    return res
  }, {})

  const childModules = studyplans.reduce((res, cur) => {
    cur.module_selections.forEach(module => {
      if (!res[module.parentModuleId]) {
        res[module.parentModuleId] = new Set()
      }
      res[module.parentModuleId].add(module.moduleId)
    })
    return res
  }, {})

  const findDegreeProgrammes = programId => {
    if (programmeModuleIdToType[programId] === 'DegreeProgramme') return [programId]
    if (!childModules[programId]) return []

    const programmes = []
    childModules[programId].forEach(child => {
      programmes.push(...findDegreeProgrammes(child))
    })
    return programmes
  }

  const getCourseCodesFromAttainment = attainment => {
    if (!attainment) return []
    if (attainment.code && attainment.type === 'CustomCourseUnitAttainment')
      return [sanitizeCourseCode(attainment.code)]
    if (attainment.nodes && attainment.nodes.length)
      return flatten(
        attainment.nodes
          .filter(node => node.attainmentId)
          .map(node => getCourseCodesFromAttainment(attainmentIdToAttainment[node.attainmentId]))
      )
    if (attainment.code) return [attainment.code]

    const { course_unit_id, module_id } = attainment
    const code = courseUnitIdToCode[course_unit_id] || programmeModuleGroupIdToCode[module_id]
    if (!code) return []
    return [code]
  }

  const getAttainmentsFromAttainment = attainment => {
    if (!attainment) return []
    if (attainment.nodes && attainment.nodes.length)
      return flatten(
        attainment.nodes
          .filter(node => node.attainmentId)
          .map(node => getAttainmentsFromAttainment(attainmentIdToAttainment[node.attainmentId]))
      )
    return [attainment]
  }

  const studyplanIdToDegreeProgrammes = studyplans.reduce((res, cur) => {
    res[cur.id] = findDegreeProgrammes(cur.root_id)
    return res
  }, {})

  const moduleIdToParentDegreeProgramme = {}
  const mapParentDegreeProgrammes = (moduleId, degreeProgrammeId) => {
    moduleIdToParentDegreeProgramme[moduleId] = degreeProgrammeId
    if (!childModules[moduleId]) return

    childModules[moduleId].forEach(child => {
      mapParentDegreeProgrammes(child, degreeProgrammeId)
    })
  }

  studyplans.forEach(plan => {
    studyplanIdToDegreeProgrammes[plan.id].forEach(programmeId => {
      mapParentDegreeProgrammes(programmeId, programmeId)
    })
  })

  const studyPlanIdToDegrees = filteredPlans.reduce((res, cur) => {
    const degreeProgrammeModules = cur.module_selections.filter(({ parentModuleId }) => parentModuleId === cur.root_id)
    res[cur.id] = degreeProgrammeModules.map(({ moduleId }) => moduleId)
    return res
  }, {})

  const moduleIdToParentModuleCode = Object.keys(moduleIdToParentDegreeProgramme).reduce((acc, cur) => {
    const parent = moduleIdToParentDegreeProgramme[cur]
    acc[cur] = programmeModuleGroupIdToCode[parent]
    return acc
  }, {})

  const mapStudyplan = studyplanMapper(
    personIdToStudentNumber,
    programmeModuleIdToCode,
    moduleIdToParentModuleCode,
    courseUnitIdToCode,
    moduleAttainments,
    attainmentIdToAttainment,
    courseUnitIdToAttainment,
    studyPlanIdToDegrees,
    educationStudyrights,
    getCourseCodesFromAttainment,
    getAttainmentsFromAttainment,
    attainments
  )

  const mappedPlans = flatten(
    filteredPlans
      .filter(p => educationHasStudyRight[p.root_id] && educationHasStudyRight[p.root_id][p.user_id])
      .map(mapStudyplan)
  ).filter(p => !!p)
  await bulkCreate(Studyplan, mappedPlans)
}

const updateEnrollments = async (enrollments, personIdToStudentNumber) => {
  const [courseUnitRealisations, courseUnits, studyRights] = await Promise.all([
    selectFromByIds(
      'course_unit_realisations',
      enrollments.map(({ course_unit_realisation_id }) => course_unit_realisation_id).filter(id => !!id)
    ),
    selectFromByIds(
      'course_units',
      enrollments.map(({ course_unit_id }) => course_unit_id).filter(id => !!id)
    ),
    selectFromActiveSnapshotsByIds(
      'studyrights',
      enrollments.map(({ study_right_id }) => study_right_id).filter(id => !!id)
    ),
  ])

  const realisationIdToActivityPeriod = courseUnitRealisations.reduce((res, cur) => {
    res[cur.id] = cur.activity_period
    return res
  }, {})

  const courseUnitIdToCourseGroupId = courseUnits.reduce((res, curr) => {
    res[curr.id] = curr.group_id
    return res
  }, {})

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

  const educations = await selectFromByIds(
    'educations',
    studyRights.map(({ education_id }) => education_id).filter(id => !!id)
  )

  const studyRightIdToEducationType = studyRights.reduce((res, curr) => {
    const education = educations.find(e => e.id === curr.education_id)
    res[curr.id] = education ? education.education_type : null
    return res
  }, {})

  const mapEnrollment = enrollmentMapper(
    personIdToStudentNumber,
    courseUnitIdToCourseGroupId,
    realisationIdToActivityPeriod,
    courseGroupIdToCourseCode,
    studyRightIdToEducationType
  )

  const mappedEnrollments = enrollments.filter(({ document_state }) => document_state === 'ACTIVE').map(mapEnrollment)
  await bulkCreate(Enrollment, mappedEnrollments)
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

  const courseCodeToAyCodelessId = new Map()

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
const semesterEnrolmentsOfStudent = allSemesterEnrollments => {
  const semesters = uniq(allSemesterEnrollments.map(s => s.semestercode))
  const semesterEnrollments = semesters.map(semester => {
    const enrollmentsForSemester = allSemesterEnrollments.filter(se => se.semestercode === semester)

    const present = enrollmentsForSemester.find(se => se.enrollmenttype === 1)
    if (present) {
      return present
    }
    const absent = enrollmentsForSemester.find(se => se.enrollmenttype === 2)
    if (absent) {
      return absent
    }

    return enrollmentsForSemester[0]
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
      .filter(t => t.student_id !== null && studyRights.some(r => r.id === t.study_right_id))
      .map(({ student_id, term_registrations, study_right_id }) =>
        term_registrations.map(mapSemesterEnrollment(student_id, study_right_id))
      )
  )

  const enrolmentsByStudents = groupBy(allSementerEnrollments, e => e.studentnumber)
  const semesterEnrollments = flatten(Object.values(enrolmentsByStudents).map(semesterEnrolmentsOfStudent))

  await bulkCreate(SemesterEnrollment, semesterEnrollments)
}

module.exports = {
  updateStudents,
}
