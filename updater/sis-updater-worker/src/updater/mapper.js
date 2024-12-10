const { sortBy, flatten, uniqBy } = require('lodash')

const { serviceProvider } = require('../config')
const { logger } = require('../utils/logger')
const {
  educationTypeToExtentcode,
  getCountry,
  getCreditTypeCodeFromAttainment,
  getGrade,
  getSemesterByDate,
  getUniOrgId,
} = require('./shared')

// Keeping previous oodi logic:
// 0 = Not known 'urn:code:gender:not-known'
// 1 = Male 'urn:code:gender:male'
// 2 = Female 'urn:code:gender:female'
// 3 = Other "urn:code:gender:other"
// Oodi also had 9 = Määrittelemätön, but Sis doesn't have this data
const genderCodes = {
  'urn:code:gender:male': '1',
  'urn:code:gender:female': '2',
  'urn:code:gender:other': '3',
  'urn:code:gender:not-known': '0',
}

const parseGender = genderUrn => genderCodes[genderUrn] ?? '0'

// "Included and substituted study modules" are not real study modules and the credits must be counted in student's total credits, etc
//  This rules out failed units and modules as well as improved ones
// See, e.g., TKT5
const validStates = ['INCLUDED', 'SUBSTITUTED', 'ATTAINED']

const customAttainmentTypes = ['CustomCourseUnitAttainment', 'CustomModuleAttainment']

const moduleTypes = ['ModuleAttainment', 'CustomModuleAttainment', 'DegreeProgrammeAttainment']

// Basically all types at the moment
const validAttainmentTypes = [...customAttainmentTypes, ...moduleTypes, 'CourseUnitAttainment']

const isModule = courseType => moduleTypes.includes(courseType)

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
  const isValidAttainment = attainment => {
    if (attainment.misregistration) return false
    if (!attainment.primary) return false
    if (attainment.expiryDate < now) return false
    // Does not have any attainments attached to it, so is not a study module whose attainments have already been counted
    if (attainment.nodes && attainment.nodes[0] !== undefined) return false
    if (!validAttainmentTypes.includes(attainment.type)) return false
    // If the state is FAILED or IMPROVED it should not be counted to total
    if (!validStates.includes(attainment.state)) return false
    return true
  }

  return attainments.reduce((sum, att) => (isValidAttainment(att) ? sum + Number(att.credits) : sum), 0)
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
    has_personal_identity_code,
  } = student

  // Filter out test student from oodi data
  if (student_number === '012023965') return null

  const gender_code = parseGender(gender_urn)

  const citizenships = (student.citizenships ?? []).map(countryUrn => getCountry(countryUrn).name)
  const home_country = student.citizenships ? getCountry(student.citizenships[0]) : null

  const studyRightsOfStudent = studyRights.filter(SR => SR.person_id === id)

  const filterNondegreeStudyrights = sr =>
    sr.phase1_education_classification_urn || sr.phase2_education_classification_urn

  const dateofuniversityenrollment =
    studyRightsOfStudent.length > 0
      ? sortBy(studyRightsOfStudent.filter(filterNondegreeStudyrights).map(sr => sr.valid.startDate))[0]
      : null

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
    secondary_email,
    phone_number,
    gender_code,
    national_student_number: oppija_id,
    birthdate: date_of_birth,
    creditcount: calculateTotalCreditsFromAttainments(attainmentsOfStudent),
    dateofuniversityenrollment,
    citizenships,
    home_country_fi: home_country ? home_country.name.fi : null,
    home_country_sv: home_country ? home_country.name.sv : null,
    home_country_en: home_country ? home_country.name.en : null,
    sis_person_id: id,
    hasPersonalIdentityCode: has_personal_identity_code,
  }
}

const mapTeacher = person => ({
  id: person.id,
  name: person.first_names ? `${person.last_name} ${person.first_names}`.trim() : person.last_name,
})

const creditMapper =
  (
    personIdToStudentNumber,
    courseUnitIdToCourseGroupId,
    moduleGroupIdToModuleCode,
    courseGroupIdToCourseCode,
    studyRightIdToEducationType
  ) =>
  attainment => {
    try {
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
        study_right_id,
        attainment_language_urn,
      } = attainment

      const responsibleOrg = organisations.find(
        o => o.roleUrn === 'urn:code:organisation-role:responsible-organisation'
      )
      const attainmentUniOrg = getUniOrgId(responsibleOrg.organisationId)
      const targetSemester = getSemesterByDate(new Date(attainment_date))
      const language = attainment_language_urn.split(':').pop()

      if (!targetSemester) return null

      const course_code = !isModule(type)
        ? courseGroupIdToCourseCode[courseUnitIdToCourseGroupId[course_unit_id]]
        : moduleGroupIdToModuleCode[module_group_id]

      const course_id = !isModule(type) ? courseUnitIdToCourseGroupId[course_unit_id] : module_group_id

      let is_open = false

      // check if ay code or ay study right or ay responsible organisation
      // if fd is not service provider
      if (serviceProvider !== 'fd') {
        if (course_code && !isModule(type)) {
          if (course_code.match(/^AY?(.+?)(?:en|fi|sv)?$/)) {
            is_open = true
          } else if (study_right_id !== null) {
            if (
              studyRightIdToEducationType[study_right_id] ===
              'urn:code:education-type:non-degree-education:open-university-studies'
            )
              is_open = true
          } else if (
            organisations
              .filter(({ roleUrn }) => roleUrn === 'urn:code:organisation-role:responsible-organisation')
              .some(org => org.organisationid === 'hy-org-48645785')
          ) {
            is_open = true
          }
        }
      }

      // Check if attainment is a module type
      const isStudyModule = isModule(type)

      const gradeObject = getGrade(grade_scale_id, grade_id)
      const grade = gradeObject.value
      const credittypecode = getCreditTypeCodeFromAttainment(attainment, gradeObject.passed)

      return {
        id,
        grade,
        student_studentnumber: personIdToStudentNumber[person_id],
        credits,
        createdate: registration_date,
        credittypecode,
        attainment_date,
        course_id,
        course_code,
        semestercode: targetSemester.semestercode,
        semester_composite: targetSemester.composite,
        isStudyModule,
        org: attainmentUniOrg,
        language,
        is_open,
        studyright_id: study_right_id,
      }
    } catch (error) {
      logger.error(`Error in attainment handling for attainment ${attainment.id}`, error)
      return null
    }
  }

const termRegistrationTypeToEnrollmenttype = termRegistrationType =>
  ({ ATTENDING: 1, NONATTENDING: 2 })[termRegistrationType] ?? 3

const courseProviderMapper =
  courseGroupId =>
  ({ organisationId, shares }) => ({
    coursecode: courseGroupId,
    organizationcode: organisationId,
    shares,
  })

const timify = date => new Date(date).getTime()

const courseMapper = courseIdToAttainments => (groupedCourse, substitutions) => {
  const [groupId, courses] = groupedCourse
  const { code, name, study_level: coursetypecode, course_unit_type } = courses[0]

  const { min_attainment_date, max_attainment_date } = courses.reduce(
    (res, curr) => {
      const courseAttainments = courseIdToAttainments[curr.id]
      if (!courseAttainments || courseAttainments.length === 0) return res
      let { min_attainment_date, max_attainment_date } = res
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
    is_study_module: course_unit_type == null, // Only course units have a course_unit_type so if it's null, it must be a study module
    substitutions,
    course_unit_type,
  }
}

const mapCourseType = studyLevel => ({
  coursetypecode: studyLevel.id,
  name: studyLevel.name,
})

const mapStudyrightExtent = educationType => ({
  extentcode: educationTypeToExtentcode[educationType.id],
  name: educationType.name,
})

const mapCurriculumPeriod = curriculumPeriod => ({
  id: curriculumPeriod.id,
  name: curriculumPeriod.name,
  universityOrgId: curriculumPeriod.university_org_id,
  startDate: new Date(curriculumPeriod.active_period.startDate),
  endDate: new Date(curriculumPeriod.active_period.endDate),
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
    // This null check is possibly unnecessary as activity_period column in the course_unit_realisations table seems to be always defined (although there's no "not null" constraint in the db)
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
      studyright_id: enrollment.study_right_id,
    }
  }

const getCorrectAttainment = (attainments, courseUnitIdToCode, courseUnitId, studyplan) => {
  return attainments.filter(
    att =>
      (courseUnitIdToCode[att.course_unit_id] === courseUnitIdToCode[courseUnitId] ||
        (courseUnitIdToCode[att.course_unit_id] &&
          courseUnitIdToCode[att.course_unit_id].replace('AY', '') === courseUnitIdToCode[courseUnitId])) &&
      validStates.includes(att.state) &&
      att.type === 'CourseUnitAttainment' &&
      att.primary &&
      !att.misregistration &&
      att.person_id === studyplan.user_id
  )
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
        .filter(courseUnit => moduleIdToParentModuleCode[courseUnit.parentModuleId]?.has(code))
        .filter(({ substituteFor }) => !substituteFor.length) // Filter out CUs used to substitute another CU
        .map(({ substitutedBy, courseUnitId }) => {
          if (substitutedBy.length) return courseUnitIdToCode[substitutedBy[0]]
          return courseUnitIdToCode[courseUnitId]
        })
      const customCourseUnitSelections = studyplan.custom_course_unit_attainment_selections
        .filter(({ parentModuleId }) => moduleIdToParentModuleCode[parentModuleId]?.has(code))
        .map(({ customCourseUnitAttainmentId }) => (attainmentIdToAttainment[customCourseUnitAttainmentId] || {}).code)
        .map(sanitizeCourseCode)
        .filter(course => !!course)

      const coursesFromAttainedModules = flatten(
        studyplan.module_selections
          .filter(
            ({ moduleId }) =>
              moduleIdToParentModuleCode[moduleId]?.has(code) &&
              moduleAttainments[moduleId] &&
              moduleAttainments[moduleId][studyplan.user_id]
          )
          .map(({ moduleId }) => getCourseCodesFromAttainment(moduleAttainments[moduleId][studyplan.user_id]))
      )

      const attainmentsToCalculate = uniqBy(
        graduated
          ? getAttainmentsFromAttainment(moduleAttainments[programmeId][studyplan.user_id])
          : studyplan.custom_course_unit_attainment_selections
              .filter(({ parentModuleId }) => moduleIdToParentModuleCode[parentModuleId]?.has(code))
              .map(({ customCourseUnitAttainmentId }) => attainmentIdToAttainment[customCourseUnitAttainmentId])
              .concat(
                flatten(
                  studyplan.course_unit_selections
                    .filter(courseUnit => moduleIdToParentModuleCode[courseUnit.parentModuleId]?.has(code))
                    .filter(({ substituteFor }) => !substituteFor.length) // Filter out CUs used to substitute another CU
                    .map(({ substitutedBy, courseUnitId }) => {
                      if (substitutedBy.length) {
                        let substitutedId = substitutedBy[0]
                        if (courseUnitIdToAttainment[substitutedId]) {
                          // Sometimes course_unit_id is not the same in attainment and course marked in hos.
                          // Filter by comparing the codes and change course_unit_id to attainment course_unit_id
                          // Until now, I have not seen cases that this if statement should be removed (line 453).
                          // Also, sometimes Hops has a course without AY even though attainment has.
                          const attainment = getCorrectAttainment(
                            attainments,
                            courseUnitIdToCode,
                            courseUnitId,
                            studyplan
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
                      const attainment = getCorrectAttainment(attainments, courseUnitIdToCode, courseUnitId, studyplan)
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
                        moduleIdToParentModuleCode[moduleId]?.has(code) &&
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
        completed_credits,
        programme_code: code,
        included_courses: includedCourses,
        sisu_id: studyplan.id,
        curriculum_period_id: studyplan.curriculum_period_id,
        sis_study_right_id: studyrightId,
      }
    })
  }

module.exports = {
  studentMapper,
  mapTeacher,
  creditMapper,
  termRegistrationTypeToEnrollmenttype,
  courseProviderMapper,
  courseMapper,
  mapCourseType,
  mapStudyrightExtent,
  mapCurriculumPeriod,
  enrollmentMapper,
  studyplanMapper,
  sanitizeCourseCode,
  validAttainmentTypes,
  customAttainmentTypes,
  isModule,
}
