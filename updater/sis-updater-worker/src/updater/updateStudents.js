const { Op } = require('sequelize')
const { flatten, uniqBy, sortBy, sortedUniqBy, groupBy, orderBy, has, get, uniq } = require('lodash')
const {
  Course,
  Student,
  SemesterEnrollment,
  Teacher,
  Credit,
  CreditTeacher,
  ElementDetail,
  Studyright,
  StudyrightElement,
  Transfer
} = require('../db/models')
const { selectFromByIds, selectFromSnapshotsByIds, bulkCreate, getCourseUnitsByCode } = require('../db')
const { educationTypeToExtentcode, getEducationType, getEducation, getUniOrgId, getDegrees, loadMapsIfNeeded } = require('./shared')
const {
  studentMapper,
  studyrightMapper,
  mapStudyrightElements,
  mapTeacher,
  creditMapper,
  semesterEnrollmentMapper
} = require('./mapper')
const { isBaMa } = require('../utils')

const groupStudyrightSnapshots = (studyRightSnapshots) => {
  const snapshotsBystudyright = Object.entries(
    groupBy(
      studyRightSnapshots.filter(sR => sR.document_state === 'ACTIVE'),
      'id'
    )
  )    

  return snapshotsBystudyright.reduce((res, [id, snapshots]) => {
    const byPhases = s => {
      const phase1 = s.accepted_selection_path.educationPhase1GroupId
      const phase2 = s.accepted_selection_path.educationPhase2GroupId ? s.accepted_selection_path.educationPhase2GroupId : 'none'
      return `${phase1}-${phase2}`
    }

    const orderedSnapshots = orderBy(snapshots, s => new Date(s.snapshot_date_time), 'desc')

    const groupedByPhases = groupBy(orderedSnapshots, byPhases)
    
    const snapshotsWithRightDate = Object.keys(groupedByPhases).map(key => {
      const snapshots = groupedByPhases[key]
      const most_recent = snapshots[0]
      const the_first = snapshots[snapshots.length-1]
      most_recent.first_snapshot_date_time = the_first.snapshot_date_time

      return most_recent
    })

    res[id] = snapshotsWithRightDate

    return res
  }, {})
}

const updateStudents = async personIds => {
  await loadMapsIfNeeded()

  const [students, studyRightSnapshots, attainments, termRegistrations, studyRightPrimalities] = await Promise.all([
    selectFromByIds('persons', personIds),
    selectFromByIds('studyrights', personIds, 'person_id'),
    selectFromByIds('attainments', personIds, 'person_id'),
    selectFromByIds('term_registrations', personIds, 'student_id'),
    selectFromByIds('study_right_primalities', personIds, 'student_id')
  ])

  /*
  const groupedStudyRightSnapshots = Object.entries(
    groupBy(
      studyRightSnapshots.filter(sR => sR.document_state === 'ACTIVE'),
      'id'
    )
  ).reduce((res, [id, snapshots]) => {
    const orderedSnapshots = orderBy(snapshots, s => new Date(s.snapshot_date_time), 'desc')
    res[id] = orderedSnapshots.filter((currentSnapshot, i) => {
      if (i === 0) return true
      return !isEqual(currentSnapshot.accepted_selection_path, orderedSnapshots[i - 1].accepted_selection_path)
    })

    return res
  }, {})

  this is deprecated by the following function call
  */

  // grouping in function that sets first_snapshot_date_time
  const groupedStudyRightSnapshots = groupStudyrightSnapshots(studyRightSnapshots)

  const latestStudyRights = Object.values(groupedStudyRightSnapshots).reduce((acc, curr) => {
    acc.push(curr[0])
    return acc
  }, [])

  const personIdToStudentNumber = students.reduce((res, curr) => {
    res[curr.id] = curr.student_number
    return res
  }, {})

  const personIdToStudyRightIdToPrimality = studyRightPrimalities.reduce((res, curr) => {
    if (!res[curr.student_id]) res[curr.student_id] = {}
    res[curr.student_id][curr.study_right_id] = curr
    return res
  }, {})

  const mappedStudents = students.map(studentMapper(attainments, studyRightSnapshots))
  await bulkCreate(Student, mappedStudents)

  const [moduleGroupIdToCode] = await Promise.all([
    updateElementDetails(flatten(Object.values(groupedStudyRightSnapshots))),
    updateStudyRights(latestStudyRights, personIdToStudentNumber, personIdToStudyRightIdToPrimality)
  ])

  await Promise.all([
    updateStudyRightElements(groupedStudyRightSnapshots, moduleGroupIdToCode, personIdToStudentNumber),
    updateTransfers(groupedStudyRightSnapshots, moduleGroupIdToCode, personIdToStudentNumber),
    updateAttainments(attainments, personIdToStudentNumber),
    updateTermRegistrations(termRegistrations, personIdToStudentNumber)
  ])
}

const updateStudyRights = async (studyRights, personIdToStudentNumber, personIdToStudyRightIdToPrimality) => {
  const mapStudyright = studyrightMapper(personIdToStudentNumber)

  const formattedStudyRights = studyRights.reduce((acc, studyright) => {
    const studyRightEducation = getEducation(studyright.education_id)
    const primality = get(personIdToStudyRightIdToPrimality, `${studyright.person_id}.${studyright.id}`)
    const primalityEndDate = get(primality, 'end_date')
    const isPrimality = primality && !primalityEndDate
    if (!studyRightEducation) return acc

    if (isBaMa(studyRightEducation)) {
      const studyRightBach = mapStudyright(studyright, {
        extentcode: 1,
        studyrightid: `${studyright.id}-1`,
        prioritycode: get(studyright, 'study_right_graduation.phase1GraduationDate')
          ? 30
          : studyright.state === 'RESCINDED'
          ? 5
          : isPrimality
          ? 1
          : 2
      })

      const studyRightMast = mapStudyright(studyright, {
        extentcode: 2,
        studyrightid: `${studyright.id}-2`,
        enddate:
          studyright.study_right_graduation && studyright.study_right_graduation.phase2GraduationDate
            ? studyright.study_right_graduation.phase2GraduationDate
            : studyright.valid.endDate,
        graduated: studyright.study_right_graduation && studyright.study_right_graduation.phase2GraduationDate ? 1 : 0,
        studystartdate: studyright.study_right_graduation
          ? studyright.study_right_graduation.phase1GraduationDate
          : null,
        prioritycode: get(studyright, 'studyright.study_right_graduation.phase2GraduationDate')
          ? 30
          : studyright.state === 'RESCINDED'
          ? 5
          : isPrimality
          ? get(studyright, 'study_right_graduation.phase1GraduationDate')
            ? 1
            : 6
          : 2
      })

      acc.push(studyRightMast, studyRightBach)
    } else {
      const educationType = getEducationType(studyRightEducation.education_type)
      const mappedStudyright = mapStudyright(studyright, {
        extentcode: educationTypeToExtentcode[educationType.id] || educationTypeToExtentcode[educationType.parent_id],
        prioritycode: studyright.state === 'GRADUATED' ? 30 : studyright.state === 'RESCINDED' ? 5 : isPrimality ? 1 : 2
      })
      acc.push(mappedStudyright)
    }
    return acc
  }, [])

  await bulkCreate(Studyright, formattedStudyRights, null, ['studyrightid'])
}

const updateElementDetails = async studyRights => {
  const groupedEducationPhases = studyRights.reduce(
    (acc, curr) => {
      const {
        accepted_selection_path: {
          educationPhase1GroupId,
          educationPhase1ChildGroupId,
          educationPhase2GroupId,
          educationPhase2ChildGroupId
        }
      } = curr
      if (educationPhase1GroupId && educationPhase2GroupId) {
        [educationPhase1GroupId, educationPhase2GroupId].forEach(group_id => {
          const degrees = getDegrees(group_id)
          if (!degrees || degrees.length !== 1) return
          const degree = degrees[0]
          acc[10].add({
            group_id: `${group_id}-degree`,
            code: degree.short_name.en,
            name: degree.name
          })
        })
      }
      acc[20].add(educationPhase1GroupId)
      acc[20].add(educationPhase2GroupId)
      acc[30].add(educationPhase1ChildGroupId)
      acc[30].add(educationPhase2ChildGroupId)

      return acc
    },
    { 10: new Set(), 20: new Set(), 30: new Set() }
  )

  const programmes = await selectFromByIds(
    'modules',
    [...groupedEducationPhases[20]].filter(a => !!a),
    'group_id'
  )
  const studytracks = await selectFromByIds(
    'modules',
    [...groupedEducationPhases[30]].filter(a => !!a),
    'group_id'
  )

  const mappedDegrees = [...groupedEducationPhases[10]].map(degree => ({...degree, type: 10}))
  const mappedProgrammes = programmes.map(programme => ({ ...programme, type: 20 }))
  const mappedStudytracks = studytracks.map(studytrack => ({ ...studytrack, type: 30 }))

  // Sort to avoid deadlocks
  await bulkCreate(
    ElementDetail,
    sortedUniqBy(sortBy([...mappedDegrees, ...mappedProgrammes, ...mappedStudytracks], ['code']), e => e.code),
    null,
    ['code']
  )

  return [...mappedDegrees, ...mappedProgrammes, ...mappedStudytracks].reduce((acc, curr) => {
    acc[curr.group_id] = curr.code
    return acc
  }, {})
}

const updateStudyRightElements = async (groupedStudyRightSnapshots, moduleGroupIdToCode, personIdToStudentNumber) => {
  const studyRightElements = Object.values(groupedStudyRightSnapshots)
    .reduce((res, snapshots) => {
      const mainStudyRight = snapshots[0]
      const mainStudyRightEducation = getEducation(mainStudyRight.education_id)
      if (!mainStudyRightEducation) return res

      const snapshotStudyRightElements = []
      const orderedSnapshots = orderBy(snapshots, s => new Date(s.snapshot_date_time), 'asc')

      const baDegreeStudyRightElement = {
        studyrightid: `${mainStudyRight.id}-1`,
        startdate: mainStudyRight.valid
            ? mainStudyRight.valid.startDate
            : mainStudyRight.study_start_date,
        enddate: mainStudyRight.study_right_graduation
            ? mainStudyRight.study_right_graduation.phase1GraduationDate
            : mainStudyRight.valid.endDate,
        studentnumber: personIdToStudentNumber[mainStudyRight.person_id],
        id: `${mainStudyRight.id}-degree-1`,
        code: getDegrees(mainStudyRight.accepted_selection_path.educationPhase1GroupId)[0].short_name.en
      }

      const maDegreeStudyRightElement = {
        studyrightid: `${mainStudyRight.id}-2`,
        startdate: mainStudyRight.valid
            ? mainStudyRight.valid.startDate
            : mainStudyRight.study_start_date,
        enddate: mainStudyRight.study_right_graduation
            ? mainStudyRight.study_right_graduation.phase2GraduationDate
            : mainStudyRight.valid.endDate,
        studentnumber: personIdToStudentNumber[mainStudyRight.person_id],
        id: `${mainStudyRight.id}-degree-2`,
        code: getDegrees(mainStudyRight.accepted_selection_path.educationPhase2GroupId)[0].short_name.en
      }
      snapshotStudyRightElements.push(baDegreeStudyRightElement, maDegreeStudyRightElement)

      orderedSnapshots.forEach(snapshot => {
        const ordinal = snapshot.modification_ordinal
        const studentnumber = personIdToStudentNumber[mainStudyRight.person_id]

        //const startDate = snapshot.valid.startDate
        // according to Eija Airio this is the right way to get the date... at least when studyright has changed
        const startDate = snapshot.first_snapshot_date_time

        const endDate =
          snapshot.study_right_graduation && snapshot.study_right_graduation.phase1GraduationDate
            ? snapshot.study_right_graduation.phase1GraduationDate
            : snapshot.valid.endDate

        if (isBaMa(mainStudyRightEducation)) {
          const [baProgramme, baStudytrack] = mapStudyrightElements(
            `${mainStudyRight.id}-1`,
            ordinal,
            startDate,
            endDate,
            studentnumber,
            moduleGroupIdToCode[snapshot.accepted_selection_path.educationPhase1GroupId],
            moduleGroupIdToCode[snapshot.accepted_selection_path.educationPhase1ChildGroupId]
          )

          const [maProgramme, maStudytrack] = mapStudyrightElements(
            `${mainStudyRight.id}-2`,
            ordinal,
            //snapshot.study_right_graduation ? snapshot.study_right_graduation.phase1GraduationDate : null,
            startDate,
            snapshot.study_right_graduation && snapshot.study_right_graduation.phase2GraduationDate
              ? snapshot.study_right_graduation.phase2GraduationDate
              : snapshot.valid.endDate,
            studentnumber,
            moduleGroupIdToCode[snapshot.accepted_selection_path.educationPhase2GroupId],
            moduleGroupIdToCode[snapshot.accepted_selection_path.educationPhase2ChildGroupId]
          )

          snapshotStudyRightElements.push(baProgramme, baStudytrack, maProgramme, maStudytrack)
        } else {
          const [programme, studytrack] = mapStudyrightElements(
            mainStudyRight.id,
            ordinal,
            startDate,
            endDate,
            studentnumber,
            moduleGroupIdToCode[snapshot.accepted_selection_path.educationPhase1GroupId],
            moduleGroupIdToCode[snapshot.accepted_selection_path.educationPhase1ChildGroupId]
          )

          snapshotStudyRightElements.push(programme, studytrack)
        }
      })

      res.push(...uniqBy(snapshotStudyRightElements, 'code'))
      return res
    }, [])
    .filter(sE => !!sE.code)

  await bulkCreate(StudyrightElement, studyRightElements)
}

const updateTransfers = async (groupedStudyRightSnapshots, moduleGroupIdToCode, personIdToStudentNumber) => {
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
        : studyrightid

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

      if (!sourcecode || !targetcode) return curr

      curr.push({
        id: `${mappedId}-${snapshot.modification_ordinal}-${sourcecode}-${targetcode}`,
        sourcecode,
        targetcode,
        transferdate: new Date(snapshot.snapshot_date_time),
        studentnumber: personIdToStudentNumber[snapshot.person_id],
        studyrightid: mappedId
      })

      return curr
    }, [])
  }

  const transfers = []
  Object.values(groupedStudyRightSnapshots).forEach(snapshots => {
    const orderedSnapshots = orderBy(snapshots, s => new Date(s.snapshot_date_time), 'asc')
    transfers.push(...getTransfersFrom(orderedSnapshots, snapshots[0].id, snapshots[0].education_id))
  })

  await bulkCreate(Transfer, transfers)
}

const updateAttainments = async (attainments, personIdToStudentNumber) => {
  const personIdToEmployeeNumber = await updateTeachers(attainments)
  const [courseUnits, modules] = await Promise.all([
    selectFromByIds(
      'course_units',
      attainments.map(a => a.course_unit_id).filter(id => !!id)
    ),
    selectFromByIds(
      'modules',
      attainments.map(a => a.module_group_id).filter(id => !!id),
      'group_id'
    )
  ])

  const courseUnitIdToCourseGroupId = courseUnits.reduce((res, curr) => {
    res[curr.id] = curr.group_id
    return res
  }, {})

  const moduleGroupIdToModuleCode = modules.reduce((res, curr) => {
    res[curr.group_id] = curr.code
    return res
  }, {})

  const courseGroupIdToCourseCode = (
    await Course.findAll({
      where: {
        id: {
          [Op.in]: Object.values(courseUnitIdToCourseGroupId)
        }
      }
    })
  ).reduce((res, curr) => {
    res[curr.id] = curr.code
    return res
  }, {})

  const properAttainmentTypes = new Set(['CourseUnitAttainment', 'ModuleAttainment', 'DegreeProgrammeAttainment', 'CustomCourseUnitAttainment'])
  const creditTeachers = []

  // This mayhem fixes missing course_unit references for CustomCourseUnitAttainments.
  const fixCustomCourseUnitAttainments = async (att) => {
    if (att.type !== 'CustomCourseUnitAttainment') {
      return att
    }

    if (!att.code) {
      return null
    }

    const codeParts = att.code.split(/\-\d+$/)
    if (!codeParts.length) {
      return null
    }

    const parsedCourseCode = codeParts[0]
    const courseUnits = await getCourseUnitsByCode(parsedCourseCode)

    const courseUnit = courseUnits.find(cu => {
      const { startDate, endDate } = cu.validity_period
      const attainment_date = new Date(att.attainment_date)

      const isAfterStart = new Date(startDate) <= attainment_date
      const isBeforeEnd = !endDate || new Date(endDate) > attainment_date

      return isAfterStart && isBeforeEnd
    })

    if (!courseUnit) {
      return null
    }

    // Add the course to the mapping objects for creditMapper to work properly.
    courseUnitIdToCourseGroupId[courseUnit.id] = courseUnit.group_id
    courseGroupIdToCourseCode[courseUnit.group_id] = courseUnit.code

    const { group_id } = courseUnit
    return { ...att, course_unit_id: courseUnit.id }
  }

  const fixAttainments = async () => Promise.all(attainments.map(fixCustomCourseUnitAttainments))
  const fixedAttainments = await fixAttainments()

  const mapCredit = creditMapper(
    personIdToStudentNumber,
    courseUnitIdToCourseGroupId,
    moduleGroupIdToModuleCode,
    courseGroupIdToCourseCode
  )

  const credits = fixedAttainments
    .filter(a => a !== null)
    .filter(a => properAttainmentTypes.has(a.type) && !a.misregistration)
    .map(a => {
      a.acceptor_persons
        .filter(p => p.roleUrn === 'urn:code:attainment-acceptor-type:approved-by' && !!p.personId)
        .forEach(p => {
          const employeeNumber = personIdToEmployeeNumber[p.personId]
          creditTeachers.push({ composite: `${a.id}-${employeeNumber}`, credit_id: a.id, teacher_id: employeeNumber })
        })

      return mapCredit(a)
    })
    .filter(c => !!c)

  await bulkCreate(Credit, credits)
  await bulkCreate(
    CreditTeacher,
    uniqBy(creditTeachers, cT => cT.composite),
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

  const personIdToEmployeeNumber = {}
  const teachers = (await selectFromByIds('persons', acceptorPersonIds))
    .filter(p => !!p.employee_number)
    .map(p => {
      personIdToEmployeeNumber[p.id] = p.employee_number
      return mapTeacher(p)
    })

  // Sort to avoid deadlocks
  await bulkCreate(Teacher, sortBy(teachers, ['id']))
  return personIdToEmployeeNumber
}

// why we are using two terms for the same thing: term registration and semester enrollment
const semesterEnrolmentsOfStudent = (allSementerEnrollments) => {
  const semesters = uniq(allSementerEnrollments.map(s => s.semestercode))
  const semesterEnrollments = semesters.map(semester => {
    const enrolmentsForSemster = allSementerEnrollments.filter(se => se.semestercode === semester)

    const present = enrolmentsForSemster.find(se => se.enrollmenttype === 1)
    if ( present ) {
      return present
    }
    const absent = enrolmentsForSemster.find(se => se.enrollmenttype === 2)
    if ( absent ) {
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

  const enrolmentsByStudents = groupBy(allSementerEnrollments, (e) => e.studentnumber)
  const semesterEnrollments = flatten(Object.values(enrolmentsByStudents).map(semesterEnrolmentsOfStudent))

  await bulkCreate(SemesterEnrollment, semesterEnrollments)
}

module.exports = {
  updateStudents
}
