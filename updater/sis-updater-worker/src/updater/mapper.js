const { sortBy, mapValues, flatten, uniqBy } = require('lodash')
const { getMinMaxDate } = require('../utils')
const {
  educationTypeToExtentcode,
  getSemesterByDate,
  getCreditTypeCodeFromAttainment,
  getGrade,
  getUniOrgId,
  getSemester,
  getCountry,
} = require('./shared')

// Keeping previous oodi logic:
// 0 = Not known 'urn:code:gender:not-known'
// 1 = Male 'urn:code:gender:male'
// 2 = Female 'urn:code:gender:female'
// 3 = Other "urn:code:gender:other"
// Oodi also had 9 = Määrittelemätön, but Sis doesn't have this data
const parseGender = gender_urn => {
  if (gender_urn === 'urn:code:gender:not-known') return '0'
  if (gender_urn === 'urn:code:gender:male') return '1'
  if (gender_urn === 'urn:code:gender:female') return '2'
  if (gender_urn === 'urn:code:gender:other') return '3'
  return '0'
}

// "Included and substituted study modules" are not real study modules and the credits must be counted in student's total credits, etc
//  This rules out failed units and modules as well as improved ones
// See, e.g., TKT5
const validStates = ['INCLUDED', 'SUBSTITUTED', 'ATTAINED']

// Basically all types at the moment
const validTypes = [
  'CourseUnitAttainment',
  'CustomCourseUnitAttainment',
  'CustomModuleAttainment',
  'ModuleAttainment',
  'DegreeProgrammeAttainment',
]

const now = new Date()

const sanitizeCourseCode = code => {
  if (!code) return null
  // Custom course unit attainments includes an Oodi surrogate in the end of course code
  const codeParts = code.split('-')
  if (!codeParts.length) return code
  if (codeParts.length === 1) return codeParts[0]
  if (codeParts[1].length < 7) return `${codeParts[0]}-${codeParts[1]}`
  return codeParts[0]
}

const calculateTotalCreditsFromAttainments = attainments => {
  const totalCredits = attainments.reduce((sum, att) => {
    // Misregistrations are not counted to the total
    if (att.misregistration) {
      return sum
    }
    if (!att.primary) {
      return sum
    }
    // Expired attainments are not counted in the total
    if (att.expiryDate < now) {
      return sum
    }

    // Does not have any attainments attached to it, so is not a study module whose attainments have already been counted
    if (att.nodes && att.nodes[0] !== undefined) {
      return sum
    }

    if (!validTypes.includes(att.type)) {
      return sum
    }

    // If the state is FAILED or IMPROVED it should not be counted to total
    if (!validStates.includes(att.state)) {
      return sum
    }

    return sum + Number(att.credits)
  }, 0)

  return totalCredits
}

const studentMapper = (attainments, studyRights, attainmentsToBeExluced) => student => {
  const {
    last_name,
    first_names,
    student_number,
    primary_email,
    secondary_email,
    phone_number,
    gender_urn,
    oppija_id,
    date_of_birth,
    id,
  } = student

  // Filter out test student from oodi data
  if (student_number === '012023965') return null

  const gender_code = parseGender(gender_urn)

  // Country logic should be fixed, see issue:
  // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2958
  const country = getCountry(student.country_urn)
  const home_country = student.citizenships ? getCountry(student.citizenships[0]) : null

  const studyRightsOfStudent = studyRights.filter(SR => SR.person_id === id)
  const dateofuniversityenrollment =
    studyRightsOfStudent.length > 0 ? sortBy(studyRightsOfStudent.map(sr => sr.valid.startDate))[0] : null

  // Current db doesn't have studentnumbers in attainment table so have to use person_id for now.
  const attainmentsOfStudent = attainments.filter(
    attainment => attainment.person_id === id && !attainmentsToBeExluced.has(attainment.id)
  )

  return {
    lastname: last_name,
    firstnames: first_names,
    abbreviatedname: `${last_name} ${first_names}`.trim(),
    studentnumber: student_number,
    email: primary_email,
    secondary_email: secondary_email,
    phone_number: phone_number,
    gender_code,
    national_student_number: oppija_id,
    birthdate: date_of_birth,
    creditcount: calculateTotalCreditsFromAttainments(attainmentsOfStudent),
    dateofuniversityenrollment,
    country_fi: country ? country.name.fi : null,
    country_sv: country ? country.name.sv : null,
    country_en: country ? country.name.en : null,
    home_country_fi: home_country ? home_country.name.fi : null,
    home_country_sv: home_country ? home_country.name.sv : null,
    home_country_en: home_country ? home_country.name.en : null,
    sis_person_id: id,
  }
}

const mapTeacher = person => ({
  id: person.id,
  name: person.first_names ? `${person.last_name} ${person.first_names}`.trim() : person.last_name,
})

const moduleTypes = new Set(['ModuleAttainment', 'DegreeProgrammeAttainment'])
const isModule = courseType => moduleTypes.has(courseType)

const creditMapper =
  (
    personIdToStudentNumber,
    courseUnitIdToCourseGroupId,
    moduleGroupIdToModuleCode,
    courseGroupIdToCourseCode,
    studyrightIdToOrganisationsName
  ) =>
  attainment => {
    const {
      id,
      credits,
      person_id,
      registration_date,
      grade_scale_id,
      grade_id,
      organisations,
      attainment_date,
      type,
      course_unit_id,
      module_group_id,
      nodes,
      study_right_id,
      attainment_language_urn,
    } = attainment

    const responsibleOrg = organisations.find(o => o.roleUrn === 'urn:code:organisation-role:responsible-organisation')
    const attainmentUniOrg = getUniOrgId(responsibleOrg.organisationId)
    const targetSemester = getSemesterByDate(new Date(attainment_date))
    const language = attainment_language_urn.split(':').pop()

    if (!targetSemester) return null

    let course_code = !isModule(type)
      ? courseGroupIdToCourseCode[courseUnitIdToCourseGroupId[course_unit_id]]
      : moduleGroupIdToModuleCode[module_group_id]

    let course_id = !isModule(type) ? courseUnitIdToCourseGroupId[course_unit_id] : module_group_id

    let is_open = false

    // check if ay code or ay studyright or ay responsible organisation
    if (course_code) {
      if (!isModule(type)) {
        if (course_code.match(/^AY?(.+?)(?:en|fi|sv)?$/)) {
          is_open = true
        } else {
          if (study_right_id !== null) {
            const organisationName = studyrightIdToOrganisationsName[study_right_id]
            if (organisationName) {
              if (organisationName['fi'].startsWith('Avoin yliopisto')) {
                is_open = true
              }
            }
          } else {
            if (
              organisations
                .filter(({ roleUrn }) => roleUrn === 'urn:code:organisation-role:responsible-organisation')
                .some(org => org.organisationid === 'hy-org-48645785')
            ) {
              is_open = true
            }
          }
        }
      }
    }

    // These are leaf attainments that have no other attainments attached to them
    const isStudyModule = nodes && nodes[0] !== undefined

    return {
      id: id,
      grade: getGrade(grade_scale_id, grade_id).value,
      student_studentnumber: personIdToStudentNumber[person_id],
      credits: credits,
      createdate: registration_date,
      credittypecode: getCreditTypeCodeFromAttainment(attainment, getGrade(grade_scale_id, grade_id).passed),
      attainment_date: attainment_date,
      course_id: course_id,
      course_code,
      semestercode: targetSemester.semestercode,
      semester_composite: targetSemester.composite,
      isStudyModule,
      org: attainmentUniOrg,
      language: language,
      is_open: is_open,
    }
  }

const termRegistrationTypeToEnrollmenttype = termRegistrationType => {
  switch (termRegistrationType) {
    case 'ATTENDING':
      return 1
    case 'NONATTENDING':
      return 2
    default:
      return 3
  }
}

const semesterEnrollmentMapper =
  (personIdToStudentNumber, studyrightToUniOrgId) => (studentId, studyRightId) => termRegistration => {
    const {
      studyTerm: { termIndex, studyYearStartYear },
      registrationDate,
      termRegistrationType,
      statutoryAbsence,
    } = termRegistration

    const enrollmenttype = termRegistrationTypeToEnrollmenttype(termRegistrationType)
    const studentnumber = personIdToStudentNumber[studentId]
    const { semestercode } = getSemester(studyrightToUniOrgId[studyRightId], studyYearStartYear, termIndex)
    const enrollment_date = registrationDate
    const org = studyrightToUniOrgId[studyRightId]

    return {
      enrollmenttype,
      studentnumber,
      semestercode,
      enrollment_date,
      org,
      semestercomposite: `${org}-${semestercode}`,
      statutory_absence: statutoryAbsence,
    }
  }

const courseProviderMapper =
  courseGroupId =>
  ({ organisationId }) => ({
    composite: `${courseGroupId}-${organisationId}`,
    coursecode: courseGroupId,
    organizationcode: organisationId,
  })

const timify = t => new Date(t).getTime()

const courseMapper = courseIdToAttainments => (groupedCourse, substitutions) => {
  const [groupId, courses] = groupedCourse
  const { code, name, study_level: coursetypecode, course_unit_type } = courses[0]

  const { min: startdate, max: enddate } = getMinMaxDate(
    courses,
    c => c.validity_period.startDate,
    c => c.validity_period.endDate
  )

  const { min_attainment_date, max_attainment_date } = courses.reduce(
    (res, curr) => {
      const courseAttainments = courseIdToAttainments[curr.id]
      if (!courseAttainments || courseAttainments.length === 0) return res
      let min_attainment_date = res.min_attainment_date
      let max_attainment_date = res.max_attainment_date
      if (!min_attainment_date || timify(min_attainment_date) > timify(courseAttainments[0].attainment_date))
        min_attainment_date = courseAttainments[0].attainment_date
      if (
        !max_attainment_date ||
        timify(max_attainment_date) < timify(courseAttainments[courseAttainments.length - 1].attainment_date)
      )
        max_attainment_date = courseAttainments[courseAttainments.length - 1].attainment_date

      return { min_attainment_date, max_attainment_date }
    },
    { min_attainment_date: null, max_attainment_date: null }
  )

  return {
    id: groupId,
    name,
    code,
    coursetypecode,
    min_attainment_date,
    max_attainment_date,
    latest_instance_date: max_attainment_date,
    startdate,
    enddate,
    is_study_module: false, // VALIDATE THIS PLS
    substitutions,
    course_unit_type,
  }
}

const mapCourseType = studyLevel => ({
  coursetypecode: studyLevel.id,
  name: studyLevel.name,
})

const mapSemester = ([org, orgStudyYears]) => {
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
        startYear: orgStudyYear.start_year,
      }
    })
  })
}

const mapStudyrightExtent = educationType => ({
  extentcode: educationTypeToExtentcode[educationType.id],
  name: educationType.name,
})

const enrollmentMapper =
  (
    personIdToStudentNumber,
    courseUnitIdToCourseGroupId,
    realisationIdToActivityPeriod,
    courseGroupIdToCourseCode,
    studyRightIdToEducationType
  ) =>
  enrollment => {
    const { startDate } = realisationIdToActivityPeriod[enrollment.course_unit_realisation_id] || {}
    const targetSemester = getSemesterByDate(new Date(startDate || enrollment.enrolment_date_time))
    const course_id = courseUnitIdToCourseGroupId[enrollment.course_unit_id]
    return {
      id: enrollment.id,
      studentnumber: personIdToStudentNumber[enrollment.person_id],
      state: enrollment.state,
      course_code: courseGroupIdToCourseCode[course_id],
      semestercode: targetSemester.semestercode,
      semester_composite: targetSemester.composite,
      enrollment_date_time: enrollment.enrolment_date_time,
      is_open:
        studyRightIdToEducationType[enrollment.study_right_id] ===
        'urn:code:education-type:non-degree-education:open-university-studies',
      course_id,
    }
  }

const studyplanMapper =
  (
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
  ) =>
  studyplan => {
    const studentnumber = personIdToStudentNumber[studyplan.user_id]
    const studyrightId = educationStudyrights[studyplan.root_id][studyplan.user_id].studyRightId
    return studyPlanIdToDegrees[studyplan.id].map(programmeId => {
      const code = programmeModuleIdToCode[programmeId]
      if (!code) return null
      const graduated = moduleAttainments[programmeId] && moduleAttainments[programmeId][studyplan.user_id]
      const id = `${studentnumber}-${code}-${studyrightId}`
      const courseUnitSelections = studyplan.course_unit_selections
        .filter(courseUnit => moduleIdToParentModuleCode[courseUnit.parentModuleId] === code)
        .filter(({ substituteFor }) => !substituteFor.length) // Filter out CUs used to substitute another CU
        .map(({ substitutedBy, courseUnitId }) => {
          if (substitutedBy.length) return courseUnitIdToCode[substitutedBy[0]]
          return courseUnitIdToCode[courseUnitId]
        })
      const customCourseUnitSelections = studyplan.custom_course_unit_attainment_selections
        .filter(({ parentModuleId }) => moduleIdToParentModuleCode[parentModuleId] === code)
        .map(({ customCourseUnitAttainmentId }) => (attainmentIdToAttainment[customCourseUnitAttainmentId] || {}).code)
        .map(sanitizeCourseCode)
        .filter(c => !!c)

      const coursesFromAttainedModules = flatten(
        studyplan.module_selections
          .filter(
            ({ moduleId }) =>
              moduleIdToParentModuleCode[moduleId] === code &&
              moduleAttainments[moduleId] &&
              moduleAttainments[moduleId][studyplan.user_id]
          )
          .map(({ moduleId }) => getCourseCodesFromAttainment(moduleAttainments[moduleId][studyplan.user_id]))
      )

      const attainmentsToCalculate = uniqBy(
        graduated
          ? getAttainmentsFromAttainment(moduleAttainments[programmeId][studyplan.user_id])
          : studyplan.custom_course_unit_attainment_selections
              .filter(({ parentModuleId }) => moduleIdToParentModuleCode[parentModuleId] === code)
              .map(({ customCourseUnitAttainmentId }) => attainmentIdToAttainment[customCourseUnitAttainmentId])
              .concat(
                flatten(
                  studyplan.course_unit_selections
                    .filter(courseUnit => moduleIdToParentModuleCode[courseUnit.parentModuleId] === code)
                    .filter(({ substituteFor }) => !substituteFor.length) // Filter out CUs used to substitute another CU
                    .map(({ substitutedBy, courseUnitId }) => {
                      if (substitutedBy.length) {
                        let substitutedId = substitutedBy[0]
                        if (courseUnitIdToAttainment[substitutedId]) {
                          // Sometimes course_unit_id is not the same in attainment and course marked in hos.
                          // Filter by comparing the codes and change course_unit_id to attainment course_unit_id
                          // Until now, I have not seen cases that this if statement should be removed (line 453).
                          const attainment = attainments.filter(
                            att =>
                              courseUnitIdToCode[att.course_unit_id] === courseUnitIdToCode[substitutedId] &&
                              validStates.includes(att.state) &&
                              att.type === 'CourseUnitAttainment' &&
                              !att.misregistration &&
                              att.person_id === studyplan.user_id
                          )
                          if (attainment.length > 0) {
                            substitutedId = attainment[0].course_unit_id
                          }
                        }
                        return courseUnitIdToAttainment[substitutedId]
                          ? courseUnitIdToAttainment[substitutedId][studyplan.user_id]
                          : []
                      }
                      // Some cases course_unit_id is not the same in attainment and course in hops. In attainments may be different
                      // course_uni_id between types AssesmentItemAttainment and CourseUnitAttainment.
                      const attainment = attainments.filter(
                        att =>
                          courseUnitIdToCode[att.course_unit_id] === courseUnitIdToCode[courseUnitId] &&
                          validStates.includes(att.state) &&
                          att.type === 'CourseUnitAttainment' &&
                          !att.misregistration &&
                          att.person_id === studyplan.user_id
                      )
                      if (attainment.length > 0) {
                        courseUnitId = attainment[0].course_unit_id
                      }

                      return courseUnitIdToAttainment[courseUnitId]
                        ? courseUnitIdToAttainment[courseUnitId][studyplan.user_id]
                        : []
                    })
                )
              )
              .concat(
                flatten(
                  studyplan.module_selections
                    .filter(
                      ({ moduleId }) =>
                        moduleIdToParentModuleCode[moduleId] === code &&
                        moduleAttainments[moduleId] &&
                        moduleAttainments[moduleId][studyplan.user_id]
                    )
                    .map(({ moduleId }) => getAttainmentsFromAttainment(moduleAttainments[moduleId][studyplan.user_id]))
                )
              )
              .filter(a => !!a),
        'id'
      )
      const completed_credits = calculateTotalCreditsFromAttainments(attainmentsToCalculate)

      const includedCourses = graduated
        ? getCourseCodesFromAttainment(moduleAttainments[programmeId][studyplan.user_id])
        : courseUnitSelections.concat(customCourseUnitSelections).concat(coursesFromAttainedModules)
      if (includedCourses.length === 0) return null
      return {
        id,
        studentnumber,
        studyrightid:
          code.includes('MH') && educationStudyrights[studyplan.root_id][studyplan.user_id].hasBaMaEducation
            ? `${educationStudyrights[studyplan.root_id][studyplan.user_id].studyRightId}-2`
            : `${educationStudyrights[studyplan.root_id][studyplan.user_id].studyRightId}-1`,
        completed_credits,
        programme_code: code,
        included_courses: includedCourses,
        sisu_id: studyplan.id,
      }
    })
  }

module.exports = {
  studentMapper,
  mapTeacher,
  creditMapper,
  semesterEnrollmentMapper,
  courseProviderMapper,
  courseMapper,
  mapCourseType,
  mapSemester,
  mapStudyrightExtent,
  enrollmentMapper,
  studyplanMapper,
  sanitizeCourseCode,
}
