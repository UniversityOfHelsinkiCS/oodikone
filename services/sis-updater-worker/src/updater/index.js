const { groupBy, flatten, flattenDeep, sortBy, mapValues, uniqBy } = require('lodash')
const {
  Organization,
  Course,
  CourseType,
  CourseProvider,
  Student,
  Semester,
  SemesterEnrollment,
  Teacher,
  CreditType,
  Credit,
  CreditTeacher,
  ElementDetail,
  StudyrightExtent,
  Studyright,
  StudyrightElement
} = require('../db/models')
const { selectFromByIds, selectFromSnapshotsByIds, bulkCreate, selectAllFrom } = require('../db')
const { getMinMaxDate, getMinMax } = require('../utils')

let daysToSemesters = null

const getSemesterByDate = date => {
  if (!daysToSemesters) throw new Error('daysToSemesters null!')
  return daysToSemesters[date.toDateString()]
}

const initDaysToSemesters = async () => {
  const semesters = await Semester.findAll()
  daysToSemesters = semesters.reduce((res, curr) => {
    const start = new Date(curr.startdate).getTime()
    const end = new Date(curr.enddate).getTime() - 1

    for (let i = start; i < end; i += 1000 * 60 * 60 * 24) {
      const newDay = new Date(i)
      res[newDay.toDateString()] = {
        semestercode: curr.semestercode,
        composite: curr.composite
      }
    }
    return res
  }, {})
}

const getCreditTypeCodeFromAttainment = attainment => {
  const { primary, state } = attainment
  if (!primary) return 7
  if (state === 'ATTAINED') return 4
  if (state === 'FAILED') return 10
  return 9
}

const creditTypeIdToCreditType = {
  4: {
    credittypecode: 4,
    name: { en: 'Completed', fi: 'Suoritettu', sv: 'Genomförd' }
  },
  7: {
    credittypecode: 7,
    name: { en: 'Improved (grade)', fi: 'Korotettu', sv: 'Höjd' }
  },
  9: {
    credittypecode: 9,
    name: { en: 'Transferred', fi: 'Hyväksiluettu', sv: 'Tillgodoräknad' }
  },
  10: {
    credittypecode: 10,
    name: { en: 'Failed', fi: 'Hylätty', sv: 'Underkänd' }
  }
}

const creditTypeIdsToCreditTypes = ids => ids.map(id => creditTypeIdToCreditType[id])

/* 
  MISSING EXTENTS:
  - 5
  - 8
  - 10
  - 11
  - 12 (maybe 31)
  - 15 (maybe 31)
  - 17
  - 20
  - 21
  - 32
  - 33
*/
const educationTypeToExtentcode = {
  'urn:code:education-type:degree-education:bachelors-degree': 1,
  'urn:code:education-type:degree-education:masters-degree': 2,
  'urn:code:education-type:degree-education:lic': 3,
  'urn:code:education-type:degree-education:doctor': 4,
  'urn:code:education-type:non-degree-education:updating-training': 6,
  'urn:code:education-type:non-degree-education:exchange-studies': 7,
  'urn:code:education-type:non-degree-education:open-university-studies': 9,
  'urn:code:education-type:non-degree-education:separate-studies:separate-teacher-pedagogical-studies': 13,
  'urn:code:education-type:non-degree-education:agreement-studies': 14,
  'urn:code:education-type:non-degree-education:agreement-studies:bilateral-agreement-studies': null, // Parent is 14
  'urn:code:education-type:non-degree-education:agreement-studies:joo-studies': null, // Parent is 14
  'urn:code:education-type:non-degree-education:agreement-studies:studies-for-secondary-school-students': 16,
  'urn:code:education-type:non-degree-education:separate-studies:specialisation-studies': 18,
  'urn:code:education-type:non-degree-education:separate-studies:separate-special-education-teacher-pedagogical-studies': 22,
  'urn:code:education-type:degree-education:specialisation-in-medicine-and-dentistry': 23,
  'urn:code:education-type:non-degree-education:summer-winter-school': 31,
  'urn:code:education-type:non-degree-education:exchange-studies-postgraduate': 34,
  'urn:code:education-type:non-degree-education:separate-studies': 99,
  'urn:code:education-type:non-degree-education:separate-studies:separate-subject-matter-studies': null, // Parent is 99
  'urn:code:education-type:non-degree-education:separate-studies:alumni-studies': null, // Parent is 99
  'urn:code:education-type:non-degree-education:separate-studies:separate-study-advisor-studies': null, // Parent is 99
  'urn:code:education-type:non-degree-education:separate-studies:separate-personal-studies': null, // Parent is 99
  'urn:code:education-type:non-degree-education:separate-studies:adult-educator-pedagogical-studies': null // Parent is 99
}

const updateOrganisations = async organisations => {
  await bulkCreate(Organization, organisations)
  console.log(`Updated ${organisations.length} organisations`)
}

const updateStudyModules = async studyModules => {
  const attainments = await selectFromByIds(
    'attainments',
    studyModules.map(s => s.id),
    'module_id'
  )
  const courseIdToAttainments = groupBy(attainments, 'module_id')
  const groupIdToCourse = groupBy(studyModules, 'group_id')

  await updateCourses(courseIdToAttainments, groupIdToCourse)
}

const updateCourseUnits = async courseUnits => {
  const attainments = await selectFromByIds(
    'attainments',
    courseUnits.map(c => c.id),
    'course_unit_id'
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

    const attainments = flatten(courses.map(c => courseIdToAttainments[c.id])).filter(a => !!a)
    const { min: min_attainment_date, max: max_attainment_date } = getMinMax(
      attainments,
      a => a.attainment_date,
      a => a.attainment_date
    )

    return {
      id: groupId,
      name,
      code,
      coursetypecode,
      minAttainmentDate: min_attainment_date,
      maxAttainmentDate: max_attainment_date,
      latestInstanceDate: max_attainment_date,
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

  console.log(`Updated ${courses.length} courses`)
}

const updateStudents = async personIds => {
  const [students, studyRights, attainments, termRegistrations] = await Promise.all([
    selectFromByIds('persons', personIds),
    selectFromSnapshotsByIds('studyrights', personIds, 'person_id'),
    selectFromByIds('attainments', personIds, 'person_id'),
    selectFromByIds('term_registrations', personIds, 'student_id')
  ])

  const personIdToStudentNumber = students.reduce((res, curr) => {
    res[curr.id] = curr.student_number
    return res
  }, {})

  const country_urns = students.map(student => student.country_urn).filter(country => country)
  const citizenship_urns = flatten(students.map(student => student.citizenships)).filter(urn => urn)

  const [countries, home_countries] = await Promise.all([
    selectFromByIds('countries', country_urns),
    selectFromByIds('countries', citizenship_urns)
  ])

  const formattedStudents = students.map(student => {
    const { last_name, first_names, student_number, primary_email, gender_urn, oppija_id, date_of_birth, id } = student

    const gender_urn_array = gender_urn ? gender_urn.split(':') : null
    const formattedGender = gender_urn_array ? gender_urn_array[gender_urn_array.length - 1] : null

    const gender_mankeli = gender => {
      if (gender === 'male') return 1
      if (gender === 'female') return 2
      return 3
    }

    const gender_code = gender_mankeli(formattedGender)

    const country = countries.find(country => country.id === student.country_urn) // country defined by primary address, not good solution most likely, fix in importer
    const home_country = student.citizenships
      ? home_countries.find(country => country.id === student.citizenships[0])
      : null // this is stupid logic PLS FIX WHEN REAL PROPER DATA

    const studyRightsOfStudent = studyRights.filter(SR => SR.person_id === id)

    const dateofuniversityenrollment =
      studyRightsOfStudent.length > 0 ? sortBy(studyRightsOfStudent.map(sr => sr.study_start_date))[0] : null

    const attainmentsOfStudent = attainments.filter(attainment => attainment.person_id === id) // current db doesn't have studentnumbers in attainment table so have to use person_id for now
    const creditcount = attainmentsOfStudent.reduce((acc, curr) => {
      if (curr.type === 'ModuleAttainment' || curr.state === 'FAILED' || curr.misregistration) return acc // bit hacky solution for now
      return acc + Number(curr.credits)
    }, 0)

    return {
      lastname: last_name,
      firstnames: first_names,
      abbreviatedname: `${last_name} ${first_names}`.trim(),
      studentnumber: student_number,
      email: primary_email,
      gender_code,
      national_student_number: oppija_id,
      home_county_id: null, //wtf this is probably trash, current db has only null in this column
      birthdate: date_of_birth,
      creditcount,
      dateofuniversityenrollment,
      country_fi: country ? country.name.fi : null,
      country_sv: country ? country.name.sv : null,
      country_en: country ? country.name.en : null,
      home_country_fi: home_country ? home_country.name.fi : null,
      home_country_sv: home_country ? home_country.name.sv : null,
      home_country_en: home_country ? home_country.name.en : null
    }
  })

  await bulkCreate(Student, formattedStudents)

  await updateStudyRights(studyRights)
  await Promise.all([
    updateAttainments(attainments),
    updateTermRegistrations(termRegistrations, personIdToStudentNumber)
  ])

  console.log(`Updated ${personIds.length} students`)
}

const updateStudyRights = async studyRights => {
  const formattedElementDetails = studyRights.reduce(
    (acc, curr) => {
      const {
        accepted_selection_path: {
          educationPhase1GroupId,
          educationPhase1ChildGroupId,
          educationPhase2GroupId,
          educationPhase2ChildGroupId
        }
      } = curr

      acc[20].add(educationPhase1GroupId)
      acc[20].add(educationPhase2GroupId)
      acc[30].add(educationPhase1ChildGroupId)
      acc[30].add(educationPhase2ChildGroupId)

      return acc
    },
    { 20: new Set(), 30: new Set() }
  )

  const programmes = await selectFromByIds(
    'modules',
    [...formattedElementDetails[20]].filter(a => !!a),
    'group_id'
  )
  const studytracks = await selectFromByIds(
    'modules',
    [...formattedElementDetails[30]].filter(a => !!a),
    'group_id'
  )

  const formattedProgrammes = programmes.map(programme => ({ ...programme, type: 20 }))
  const formattedStudytracks = studytracks.map(studytrack => ({ ...studytrack, type: 30 }))

  const moduleGroupIdToCode = [...formattedProgrammes, ...formattedStudytracks].reduce((acc, curr) => {
    acc[curr.group_id] = curr.code
    return acc
  }, {})

  await bulkCreate(
    ElementDetail,
    uniqBy([...formattedProgrammes, ...formattedStudytracks], e => e.code),
    null,
    ['code']
  )

  const educationIds = studyRights.map(sr => sr.education_id)

  const personIds = studyRights.map(sr => sr.person_id)

  const educationIdToEducation = (await selectFromByIds('educations', educationIds)).reduce((acc, curr) => {
    acc[curr.id] = curr
    return acc
  }, {})

  const educationTypes = (await selectAllFrom('education_types')).reduce((acc, curr) => {
    acc[curr.id] = curr
    return acc
  }, {})

  const organisationUrnToCode = (await Organization.findAll()).reduce((acc, curr) => {
    acc[curr.id] = curr.code
    return acc
  }, {})

  const personToStudentNumber = (await selectFromByIds('persons', personIds)).reduce((acc, curr) => {
    acc[curr.id] = curr.student_number
    return acc
  }, {})

  const studyrightElements = []

  const formattedStudyRights = studyRights.reduce((acc, studyright) => {
    const studyRightEducation = educationIdToEducation[studyright.education_id]

    if (!studyRightEducation) return acc

    if (
      studyRightEducation.education_type === 'urn:code:education-type:degree-education:bachelors-and-masters-degree' // :D
    ) {
      const studyRightBach = {
        extentcode: 1,
        studyrightid: `${studyright.id}-1`,
        facultyCode: organisationUrnToCode[studyright.organisation_id],
        startdate: studyright.valid.startDate,
        enddate: studyright.study_right_graduation
          ? studyright.study_right_graduation.phase1GraduationDate
          : studyright.valid.endDate,
        givendate: studyright.grant_date,
        canceldate: studyright.study_right_cancellation ? studyright.study_right_cancellation.cancellationDate : null,
        graduated: studyright.study_right_graduation ? 1 : 0,
        studystartdate: studyright.study_start_date,
        prioritycode: 1, // fix this pls
        studentStudentnumber: personToStudentNumber[studyright.person_id]
      }

      studyrightElements.push({
        studyrightid: studyRightBach.studyrightid,
        id: `${studyRightBach.studyrightid}-1`,
        startdate: studyRightBach.startdate,
        enddate: studyRightBach.enddate,
        code: moduleGroupIdToCode[studyright.accepted_selection_path.educationPhase1GroupId],
        studentnumber: studyRightBach.studentStudentnumber
      })

      studyrightElements.push({
        studyrightid: studyRightBach.studyrightid,
        id: `${studyRightBach.studyrightid}-2`,
        startdate: studyRightBach.startdate,
        enddate: studyRightBach.enddate,
        code: moduleGroupIdToCode[studyright.accepted_selection_path.educationPhase1ChildGroupId],
        studentnumber: studyRightBach.studentStudentnumber
      })

      const studyRightMast = {
        extentcode: 2,
        studyrightid: `${studyright.id}-2`,
        facultyCode: organisationUrnToCode[studyright.organisation_id],
        startdate: studyright.valid.startDate,
        enddate:
          studyright.study_right_graduation && studyright.study_right_graduation.phase2GraduationDate
            ? studyright.study_right_graduation.phase2GraduationDate
            : studyright.valid.endDate,
        givendate: studyright.grant_date,
        canceldate: studyright.study_right_cancellation ? studyright.study_right_cancellation.cancellationDate : null,
        graduated: studyright.study_right_graduation && studyright.study_right_graduation.phase2GraduationDate ? 1 : 0,
        studystartdate: studyright.study_right_graduation
          ? studyright.study_right_graduation.phase1GraduationDate
          : null,
        prioritycode: 1,
        studentStudentnumber: personToStudentNumber[studyright.person_id]
      }

      studyrightElements.push({
        studyrightid: studyRightMast.studyrightid,
        id: `${studyRightMast.studyrightid}-1`,
        startdate: studyRightMast.startdate,
        enddate: studyRightMast.enddate,
        code: moduleGroupIdToCode[studyright.accepted_selection_path.educationPhase2GroupId],
        studentnumber: studyRightMast.studentStudentnumber
      })

      studyrightElements.push({
        studyrightid: studyRightMast.studyrightid,
        id: `${studyRightMast.studyrightid}-2`,
        startdate: studyRightMast.startdate,
        enddate: studyRightMast.enddate,
        code: moduleGroupIdToCode[studyright.accepted_selection_path.educationPhase2ChildGroupId],
        studentnumber: studyRightMast.studentStudentnumber
      })

      acc.push(studyRightMast, studyRightBach)
    } else {
      const currentEducationType = educationTypes[studyRightEducation.education_type]
      const studyRight = {
        extentcode:
          educationTypeToExtentcode[currentEducationType.id] ||
          educationTypeToExtentcode[currentEducationType.parent_id], // hyi
        studyrightid: studyright.id,
        facultyCode: organisationUrnToCode[studyright.organisation_id],
        startdate: studyright.valid.startDate,
        enddate: studyright.study_right_graduation
          ? studyright.study_right_graduation.phase1GraduationDate
          : studyright.valid.endDate,
        givendate: studyright.grant_date,
        canceldate: studyright.study_right_cancellation ? studyright.study_right_cancellation.cancellationDate : null,
        graduated: studyright.study_right_graduation ? 1 : 0,
        studystartdate: studyright.study_start_date,
        prioritycode: 1, // fix this pls
        studentStudentnumber: personToStudentNumber[studyright.person_id]
      }
      acc.push(studyRight)

      studyrightElements.push({
        studyrightid: studyRight.studyrightid,
        id: `${studyRight.studyrightid}-1`,
        startdate: studyRight.startdate,
        enddate: studyRight.enddate,
        code: moduleGroupIdToCode[studyright.accepted_selection_path.educationPhase1GroupId],
        studentnumber: studyRight.studentStudentnumber
      })

      studyrightElements.push({
        studyrightid: studyRight.studyrightid,
        id: `${studyRight.studyrightid}-2`,
        startdate: studyRight.startdate,
        enddate: studyRight.enddate,
        code: moduleGroupIdToCode[studyright.accepted_selection_path.educationPhase1ChildGroupId],
        studentnumber: studyRight.studentStudentnumber
      })
    }
    return acc
  }, [])

  await bulkCreate(Studyright, formattedStudyRights, null, ['studyrightid'])
  await bulkCreate(
    StudyrightElement,
    studyrightElements.filter(s_element => !!s_element.code)
  )
}

const updateAttainments = async attainments => {
  if (!daysToSemesters) await initDaysToSemesters()

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
      return {
        id: p.employee_number,
        name: `${p.last_name} ${p.first_names}`
      }
    })
  await bulkCreate(Teacher, teachers)

  const personIdToStudentNumber = (
    await selectFromByIds(
      'persons',
      attainments.map(a => a.person_id)
    )
  ).reduce((res, curr) => {
    res[curr.id] = curr.student_number
    return res
  })

  const gradeScaleIdToGradeIdsToGrades = (
    await selectFromByIds(
      'grade_scales',
      attainments.map(a => a.grade_scale_id)
    )
  ).reduce((res, curr) => {
    res[curr.id] = curr.grades.reduce((res, curr) => {
      const {
        localId,
        numericCorrespondence,
        abbreviation: { fi }
      } = curr
      if (!res[localId]) res[localId] = numericCorrespondence || fi
      return res
    }, {})
    return res
  }, {})

  const courseUnitIdToCourseGroupId = (
    await selectFromByIds(
      'course_units',
      attainments.map(a => a.course_unit_id)
    )
  ).reduce((res, curr) => {
    res[curr.id] = curr.group_id
    return res
  }, {})

  const organisations = await selectFromSnapshotsByIds(
    'organisations',
    flatten(attainments.map(a => a.organisations.map(o => o.organisationId)))
  )
  const orgToUniOrgId = organisations.reduce((res, curr) => {
    res[curr.id] = curr.university_org_id
    return res
  }, {})

  const properAttainmentTypes = new Set(['CourseUnitAttainment', 'ModuleAttainment'])
  const creditTeachers = []

  const credits = attainments
    .filter(a => properAttainmentTypes.has(a.type) && !a.misregistration)
    .map(a => {
      const { grade_scale_id, grade_id } = a
      const responsibleOrg = a.organisations.find(
        o => o.roleUrn === 'urn:code:organisation-role:responsible-organisation'
      )
      const attainmentUniOrg = orgToUniOrgId[responsibleOrg.organisationId]
      a.acceptor_persons
        .filter(p => p.roleUrn === 'urn:code:attainment-acceptor-type:approved-by' && !!p.personId)
        .forEach(p => {
          const employeeNumber = personIdToEmployeeNumber[p.personId]
          creditTeachers.push({ composite: `${a.id}-${employeeNumber}`, credit_id: a.id, teacher_id: employeeNumber })
        })

      const targetSemester = getSemesterByDate(new Date(a.attainment_date))

      return {
        id: a.id,
        grade: gradeScaleIdToGradeIdsToGrades[grade_scale_id][grade_id],
        student_studentnumber: personIdToStudentNumber[a.person_id],
        credits: a.credits,
        createdate: a.registration_date,
        credittypecode: getCreditTypeCodeFromAttainment(a),
        attainment_date: a.attainment_date,
        course_code:
          a.type === 'CourseUnitAttainment' ? courseUnitIdToCourseGroupId[a.course_unit_id] : a.module_group_id,
        semestercode: targetSemester.semestercode,
        semester_composite: targetSemester.composite,
        isStudyModule: a.type === 'ModuleAttainment',
        org: attainmentUniOrg
      }
    })

  await bulkCreate(Credit, credits)
  await bulkCreate(
    CreditTeacher,
    uniqBy(creditTeachers, cT => cT.composite),
    null,
    ['composite']
  )

  console.log(`Updated ${credits.length} credits`)
}

const updateTermRegistrations = async (termRegistrations, personIdToStudentNumber) => {
  const semesters = await Semester.findAll()
  const studyRightIds = termRegistrations.map(({ study_right_id }) => study_right_id)
  const studyRights = await selectFromSnapshotsByIds('studyrights', studyRightIds)
  const orgIds = studyRights.map(({ organisation_id }) => organisation_id)
  const organisations = await selectFromSnapshotsByIds('organisations', orgIds)

  const orgToStartYearToSemesters = semesters.reduce((res, curr) => {
    if (!res[curr.org]) res[curr.org] = {}
    if (!res[curr.org][curr.startYear]) res[curr.org][curr.startYear] = {}
    res[curr.org][curr.startYear][curr.termIndex] = curr
    return res
  }, {})

  const orgToUniOrgId = organisations.reduce((res, curr) => {
    res[curr.id] = curr.university_org_id
    return res
  }, {})

  const studyrightToUniOrgId = studyRights.reduce((res, curr) => {
    res[curr.id] = orgToUniOrgId[curr.organisation_id]
    return res
  }, {})

  const semesterEnrollments = uniqBy(
    flatten(
      termRegistrations.map(({ student_id, term_registrations, study_right_id }) => {
        return term_registrations.map(
          ({
            studyTerm: { termIndex, studyYearStartYear },
            registrationDate,
            termRegistrationType,
            statutoryAbsence
          }) => {
            const enrollmenttype = termRegistrationType === 'ATTENDING' ? 1 : 2
            const studentnumber = personIdToStudentNumber[student_id]
            const { semestercode } = orgToStartYearToSemesters[studyrightToUniOrgId[study_right_id]][
              studyYearStartYear
            ][termIndex]
            const enrollment_date = registrationDate
            const org = studyrightToUniOrgId[study_right_id]
            return {
              enrollmenttype,
              studentnumber,
              semestercode,
              enrollment_date,
              org,
              semestercomposite: `${org}-${semestercode}`,
              statutory_absence: statutoryAbsence
            }
          }
        )
      })
    ),
    sE => `${sE.studentnumber}${sE.semestercomposite}`
  )

  await bulkCreate(SemesterEnrollment, semesterEnrollments)
}

const updateCourseTypes = async studyLevels => {
  const mapStudyLevelToCourseType = studyLevel => ({
    coursetypecode: studyLevel.id,
    name: studyLevel.name
  })
  await bulkCreate(CourseType, studyLevels.map(mapStudyLevelToCourseType))
  console.log(`Updated ${studyLevels.length} course types`)
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
  console.log(`Updated ${semesters.length} semesters`)
}

const updateCreditTypes = async creditTypes => {
  await bulkCreate(CreditType, creditTypes)
  console.log(`Updated ${creditTypes.length} credit types`)
}

const updateStudyrightExtents = async educationTypes => {
  const studyrightExtents = educationTypes
    .map(eT => ({
      extentcode: educationTypeToExtentcode[eT.id],
      name: eT.name
    }))
    .filter(eT => eT.extentcode)

  await bulkCreate(StudyrightExtent, studyrightExtents, null, ['extentcode'])
  console.log(`Updated ${educationTypes.length} studyright extents`)
}

const idToHandler = {
  students: updateStudents,
  organisations: updateOrganisations,
  study_modules: updateStudyModules,
  course_units: updateCourseUnits,
  study_levels: updateCourseTypes,
  study_years: updateSemesters,
  credit_types: updateCreditTypes,
  education_types: updateStudyrightExtents
}

const update = async ({ entityIds, type }) => {
  const updateHandler = idToHandler[type]
  switch (type) {
    case 'students':
      return await updateHandler(entityIds)
    case 'credit_types':
      return await updateHandler(creditTypeIdsToCreditTypes(entityIds))
    case 'organisations':
      return await updateHandler(await selectFromSnapshotsByIds(type, entityIds))
    case 'course_units':
      return await updateHandler(await selectFromByIds(type, entityIds, 'group_id'))
    case 'study_years':
      return await updateHandler(await selectFromByIds(type, entityIds, 'org'))
    case 'study_modules':
      return await updateHandler(await selectFromByIds('modules', entityIds, 'group_id'))
    case 'education_types':
    case 'study_levels':
      return await updateHandler(await selectFromByIds(type, entityIds))
  }
}

module.exports = {
  update
}
