const { sortBy, mapValues } = require('lodash')
const { getMinMaxDate } = require('../utils')
const {
  educationTypeToExtentcode,
  getSemesterByDate,
  getCreditTypeCodeFromAttainment,
  getOrganisationCode,
  getGrade,
  getUniOrgId,
  getSemester,
  getCountry,
} = require('./shared')
const { CREDIT_TYPE_CODES } = require('./shared')

const genderMankeli = gender => {
  if (gender === 'male') return 1
  if (gender === 'female') return 2
  return 3
}


const studentMapper = (attainments, studyRights) => student => {
  const { last_name, first_names, student_number, primary_email, gender_urn, oppija_id, date_of_birth, id } = student

  const gender_urn_array = gender_urn ? gender_urn.split(':') : null
  const formattedGender = gender_urn_array ? gender_urn_array[gender_urn_array.length - 1] : null
  const gender_code = genderMankeli(formattedGender)

  const country = getCountry(student.country_urn)
  const home_country = student.citizenships ? getCountry(student.citizenships[0]) : null // this is stupid logic PLS FIX WHEN REAL PROPER DATA
  const studyRightsOfStudent = studyRights.filter(SR => SR.person_id === id)

  const dateofuniversityenrollment =
    studyRightsOfStudent.length > 0 ? sortBy(studyRightsOfStudent.map(sr => sr.valid.startDate))[0] : null

  const attainmentsOfStudent = attainments.filter(attainment => attainment.person_id === id) // current db doesn't have studentnumbers in attainment table so have to use person_id for now
  const creditcount = attainmentsOfStudent.reduce((acc, curr) => {
    if (curr.type === 'ModuleAttainment' || curr.misregistration) return acc // bit hacky solution for now
    const credittypecode = getCreditTypeCodeFromAttainment(curr, getGrade(curr.grade_scale_id, curr.grade_id).passed)
    if (credittypecode === CREDIT_TYPE_CODES.APPROVED || credittypecode === CREDIT_TYPE_CODES.PASSED) {
      return acc + Number(curr.credits)
    }
    return acc
  }, 0)

  return {
    lastname: last_name,
    firstnames: first_names,
    abbreviatedname: `${last_name} ${first_names}`.trim(),
    studentnumber: student_number,
    email: primary_email,
    gender_code,
    national_student_number: oppija_id,
    home_county_id: null, // wtf this is probably trash, current db has only null in this column
    birthdate: date_of_birth,
    creditcount,
    dateofuniversityenrollment,
    country_fi: country ? country.name.fi : null,
    country_sv: country ? country.name.sv : null,
    country_en: country ? country.name.en : null,
    home_country_fi: home_country ? home_country.name.fi : null,
    home_country_sv: home_country ? home_country.name.sv : null,
    home_country_en: home_country ? home_country.name.en : null,
  }
}

const studyrightMapper = personIdToStudentNumber => (studyright, overrideProps) => {
  const defaultProps = {
    facultyCode: getOrganisationCode(studyright.organisation_id),
    startdate: studyright.valid.startDate,
    givendate: studyright.grant_date,
    canceldate: studyright.study_right_cancellation ? studyright.study_right_cancellation.cancellationDate : null,
    studentStudentnumber: personIdToStudentNumber[studyright.person_id],
    prioritycode: 2,
    educationType: 99,
  }

  return {
    ...defaultProps,
    studyrightid: studyright.id,
    enddate: studyright.study_right_graduation
      ? studyright.study_right_graduation.phase1GraduationDate
      : studyright.valid.endDate,
    graduated: studyright.study_right_graduation ? 1 : 0,
    // studystartdate: studyright.study_start_date, '
    // accoriding to Eija the right date is the following
    studystartdate: studyright.valid.startDate, 
    ...overrideProps,
  }
}

const mapStudyrightElements = (studyrightid, ordinal, startdate, enddate, studentnumber, code, childCode, degreeCode) => {
  const defaultProps = {
    studyrightid,
    startdate,
    enddate,
    studentnumber,
  }

  return [
    {
    ...defaultProps,
    id: `${defaultProps.studyrightid}-${code}-degree`,
    code: degreeCode
    },
    {
      ...defaultProps,
      id: `${defaultProps.studyrightid}-${code}-1`,
      code,
    },
    {
      ...defaultProps,
      id: `${defaultProps.studyrightid}-${code}-2`,
      code: childCode,
    },
  ]
}

const mapTeacher = person => ({
  id: person.employee_number,
  name: `${person.last_name} ${person.first_names}`.trim(),
})

const moduleTypes = new Set(['ModuleAttainment', 'DegreeProgrammeAttainment'])
const isModule = courseType => moduleTypes.has(courseType)

const creditMapper = (
  personIdToStudentNumber,
  courseUnitIdToCourseGroupId,
  moduleGroupIdToModuleCode,
  courseGroupIdToCourseCode
) => attainment => {
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
  } = attainment
  const responsibleOrg = organisations.find(o => o.roleUrn === 'urn:code:organisation-role:responsible-organisation')
  const attainmentUniOrg = getUniOrgId(responsibleOrg.organisationId)
  const targetSemester = getSemesterByDate(new Date(attainment_date))

  if (!targetSemester) return null

  return {
    id: id,
    grade: getGrade(grade_scale_id, grade_id).value,
    student_studentnumber: personIdToStudentNumber[person_id],
    credits: credits,
    createdate: registration_date,
    credittypecode: getCreditTypeCodeFromAttainment(attainment, getGrade(grade_scale_id, grade_id).passed),
    attainment_date: attainment_date,
    course_id: !isModule(type) ? courseUnitIdToCourseGroupId[course_unit_id] : module_group_id,
    course_code: !isModule(type)
      ? courseGroupIdToCourseCode[courseUnitIdToCourseGroupId[course_unit_id]]
      : moduleGroupIdToModuleCode[module_group_id],
    semestercode: targetSemester.semestercode,
    semester_composite: targetSemester.composite,
    isStudyModule: isModule(type),
    org: attainmentUniOrg,
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

const semesterEnrollmentMapper = (personIdToStudentNumber, studyrightToUniOrgId) => (
  studentId,
  studyRightId
) => termRegistration => {
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

const courseProviderMapper = courseGroupId => ({ organisationId }) => ({
  composite: `${courseGroupId}-${organisationId}`,
  coursecode: courseGroupId,
  organizationcode: organisationId,
})

const timify = t => new Date(t).getTime()

const courseMapper = courseIdToAttainments => ([groupId, courses]) => {
  const { code, name, study_level: coursetypecode } = courses[0]

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

module.exports = {
  studentMapper,
  studyrightMapper,
  mapStudyrightElements,
  mapTeacher,
  creditMapper,
  semesterEnrollmentMapper,
  courseProviderMapper,
  courseMapper,
  mapCourseType,
  mapSemester,
  mapStudyrightExtent,
}
