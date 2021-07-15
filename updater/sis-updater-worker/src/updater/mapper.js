const { sortBy, mapValues } = require('lodash')
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
// 0 = Not known
// 1 = Male
// 2 = Female
// 3 = Other
// Oodi also had 9 = Määrittelemätön, but Sis doesn't have this data
const parseGender = gender_urn => {
  if (!gender_urn) return 0
  if (gender_urn === 'urn:code:gender:male') return 1
  if (gender_urn === 'urn:code:gender:female') return 2
  return 3
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
  const { last_name, first_names, student_number, primary_email, gender_urn, oppija_id, date_of_birth, id } = student

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
    gender_code,
    national_student_number: oppija_id,
    home_county_id: null, // wtf this is probably trash, current db has only null in this column
    birthdate: date_of_birth,
    creditcount: calculateTotalCreditsFromAttainments(attainmentsOfStudent),
    dateofuniversityenrollment,
    country_fi: country ? country.name.fi : null,
    country_sv: country ? country.name.sv : null,
    country_en: country ? country.name.en : null,
    home_country_fi: home_country ? home_country.name.fi : null,
    home_country_sv: home_country ? home_country.name.sv : null,
    home_country_en: home_country ? home_country.name.en : null,
  }
}

const mapTeacher = person => ({
  id: person.employee_number,
  name: `${person.last_name} ${person.first_names}`.trim(),
})

const moduleTypes = new Set(['ModuleAttainment', 'DegreeProgrammeAttainment'])
const isModule = courseType => moduleTypes.has(courseType)

const creditMapper =
  (personIdToStudentNumber, courseUnitIdToCourseGroupId, moduleGroupIdToModuleCode, courseGroupIdToCourseCode) =>
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
    } = attainment

    const responsibleOrg = organisations.find(o => o.roleUrn === 'urn:code:organisation-role:responsible-organisation')
    const attainmentUniOrg = getUniOrgId(responsibleOrg.organisationId)
    const targetSemester = getSemesterByDate(new Date(attainment_date))

    if (!targetSemester) return null

    const course_code = !isModule(type)
      ? courseGroupIdToCourseCode[courseUnitIdToCourseGroupId[course_unit_id]]
      : moduleGroupIdToModuleCode[module_group_id]

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
      course_id: !isModule(type) ? courseUnitIdToCourseGroupId[course_unit_id] : module_group_id,
      course_code,
      semestercode: targetSemester.semestercode,
      semester_composite: targetSemester.composite,
      isStudyModule,
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
    substitutions,
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
  mapTeacher,
  creditMapper,
  semesterEnrollmentMapper,
  courseProviderMapper,
  courseMapper,
  mapCourseType,
  mapSemester,
  mapStudyrightExtent,
}
