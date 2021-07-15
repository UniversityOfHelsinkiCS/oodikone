const Oodi = require('./oodi_interface')
const mapper = require('./oodi_data_mapper')

const getAllStudentInformationFromApi = async studentnumber => {
  const [student, studyrights, studyattainments, semesterEnrollments, courseEnrollments] = await Promise.all([
    Oodi.getStudent(studentnumber),
    Oodi.getStudentStudyRights(studentnumber),
    Oodi.getStudyAttainments(studentnumber),
    Oodi.getSemesterEnrollments(studentnumber),
    Oodi.getCourseEnrollments(studentnumber)
  ])
  return {
    student,
    studyrights,
    studyattainments,
    studentnumber,
    semesterEnrollments,
    courseEnrollments
  }
}

const formatStudyrights = async (api, studentnumber) => {
  if (api.studyrights.length === 0) {
    console.log(`No studyrights for ${studentnumber}`)
    return []
  }
  return api.studyrights.map(studyrightData => {
    const studyRightExtent = mapper.studyrightDataToExtent(studyrightData)
    const studyright = mapper.getStudyRightFromData(studyrightData, studentnumber)

    const elementDetails = studyrightData.elements.map(element => mapper.elementDetailFromData(element))
    const studyRightElements = studyrightData.elements.map(element =>
      mapper.studyrightElementFromData(element, studyright.studyrightid, studentnumber, studyrightData.degree_date)
    )

    const transfers = mapper.getTransfersFromData(studyrightData, studentnumber)
    return { studyRightExtent, studyright, elementDetails, studyRightElements, transfers }
  })
}

const formatCourseEnrollments = async (apidata, studentnumber) =>
  await Promise.all(
    apidata.courseEnrollments.map(enrollment => mapper.studentEnrollmentToModels(enrollment, studentnumber))
  )

const parseAttainmentData = (data, studentnumber) => {
  return {
    credit: mapper.attainmentDataToCredit(data, studentnumber),
    teachers: mapper.attainmentDataToTeachers(data),
    course: mapper.attainmentDataToCourse(data)
  }
}

const createCreditTeachers = async (credit, teachers) => {
  const creditTeachers = teachers.map(teacher => ({
    credit_id: credit.id,
    teacher_id: teacher.id
  }))
  return creditTeachers
}

const formatStudyattainments = async (api, studentnumber) => {
  let studyAttainments = []
  for (let data of api.studyattainments) {
    const { credit, teachers, course } = parseAttainmentData(data, studentnumber)
    let learningOpportunity
    // For some learning opportunities oodi returns an SQL error.
    // F.ex. /learningopportunities/590202B. Therefore, until the
    // bug is fixed on Oodi's side, this is what we need to do.
    try {
      learningOpportunity = await Oodi.getLearningOpportunity(course.code)
    } catch (e) {
      if (e.message && e.message.includes('PreparedStatementCallback')) continue
      throw e
    }
    const { providers, courseproviders } = mapper.learningOpportunityDataToCourseProviders(learningOpportunity)

    studyAttainments = [
      ...studyAttainments,
      {
        credit: credit.semestercode
          ? credit
          : { ...credit, semestercode: mapper.getSemesterCode(credit.attainment_date) },
        creditTeachers: await createCreditTeachers(credit, teachers),
        teachers: (await Promise.all(
          teachers.map(async t => {
            const teacher = await Oodi.getTeacherInfo(t.id)
            // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/1547#issuecomment-550184131
            // Sometimes Oodi returns a null teacher... We need to figure out why.
            if (!teacher) {
              console.log('TEACHER MISSING!', t.id)
              return null
            }
            return mapper.getTeacherFromData(teacher)
          })
        )).filter(t => t),
        course: {
          ...course,
          ...mapper.learningOpportunityDataToCourse(learningOpportunity),
          disciplines: mapper.learningOpportunityDataToCourseDisciplines(learningOpportunity),
          providers,
          courseproviders
        }
      }
    ]
  }
  return studyAttainments
}
const formatSemesterEnrollments = async (apidata, studentnumber) =>
  await Promise.all(
    apidata.semesterEnrollments.map(apiEnrollment => mapper.semesterEnrollmentFromData(apiEnrollment, studentnumber))
  )

const getStudent = async studentnumber => {
  const api = await getAllStudentInformationFromApi(studentnumber)
  if (api.student == null) {
    const error = new Error(`API returned ${api.student} for studentnumber ${studentnumber}.`)
    error.name = 'NO_STUDENT'
    throw error
  }
  try {
    const studentInfo = await mapper.getStudentFromData(api.student, api.studyrights)
    const [studyRights, studyAttainments, semesterEnrollments, courseEnrollments] = await Promise.all([
      formatStudyrights(api, studentnumber),
      formatStudyattainments(api, studentnumber),
      formatSemesterEnrollments(api, studentnumber),
      formatCourseEnrollments(api, studentnumber)
    ])
    return { studentInfo, studyRights, studyAttainments, semesterEnrollments, courseEnrollments }
  } catch (e) {
    console.error('getStudent failed', api)
    throw e
  }
}

const getMeta = async () => {
  const [
    faculties,
    courseRealisationsTypes,
    semesters,
    creditTypeCodes,
    courseTypeCodes,
    disciplines
  ] = await Promise.all([
    (await Oodi.getFaculties()).map(mapper.getOrganisationFromData),
    (await Oodi.getCourseRealisationTypes()).map(mapper.courseRealisationTypeFromData),
    (await Oodi.getSemesters()).map(mapper.semesterFromData),
    (await Oodi.getStudyattainmentStatusCodes()).map(mapper.studyattainmentStatusCodeToCreditType),
    (await Oodi.getCourseTypeCodes()).map(mapper.courseTypeFromData),
    (await Oodi.getCourseDisciplines()).map(mapper.disciplineFromData)
  ])
  return { faculties, courseRealisationsTypes, semesters, creditTypeCodes, courseTypeCodes, disciplines }
}

module.exports = {
  getStudent,
  getMeta
}
