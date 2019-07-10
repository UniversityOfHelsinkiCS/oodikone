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
    const studyRightElements = studyrightData.elements.map(element => mapper.studyrightElementFromData(element, studyright.studyrightid, studentnumber))

    const transfers = mapper.getTransfersFromData(studyrightData, studentnumber)
    return { studyRightExtent, studyright, elementDetails, studyRightElements, transfers }
  })
}

const formatCourseEnrollments = async (apidata, studentnumber) => await Promise.all(apidata.courseEnrollments.map(enrollment => mapper.studentEnrollmentToModels(enrollment, studentnumber)))


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
    const learningOpportunity = await Oodi.getLearningOpportunity(course.code)
    const { providers, courseproviders } = mapper.learningOpportunityDataToCourseProviders(learningOpportunity)

    studyAttainments = [
      ...studyAttainments, {
        credit: (credit.semestercode ? credit : { ...credit, semestercode: mapper.getSemesterCode(credit.attainment_date) }),
        creditTeachers: await createCreditTeachers(credit, teachers),
        teachers: await Promise.all(teachers.map(async (t) => mapper.getTeacherFromData((await Oodi.getTeacherInfo(t.id))))),
        course: {
          ...course, ...mapper.learningOpportunityDataToCourse(learningOpportunity),
          disciplines: mapper.learningOpportunityDataToCourseDisciplines(learningOpportunity),
          providers,
          courseproviders
        }
      }
    ]
  }
  return studyAttainments
}
const formatSemesterEnrollments = async (apidata, studentnumber) => await Promise.all(apidata.semesterEnrollments.map(apiEnrollment => mapper.semesterEnrollmentFromData(apiEnrollment, studentnumber)))

const createOrUpdateCourseProviders = async data => {
  const { providers, courseproviders } = mapper.learningOpportunityDataToCourseProviders(data)
  await Promise.all(providers.map(provider => Provider.upsert(provider)))
  await Promise.all(courseproviders.map(courseprovider => CourseProvider.upsert(courseprovider)))
}
const getStudent = async (studentnumber) => {
  const api = await getAllStudentInformationFromApi(studentnumber)
  if (api.student === null || api.student === undefined) {
    throw new Error(`API returned ${api.student} for studentnumber ${studentnumber}.`)
  }
  const studentInfo = await mapper.getStudentFromData(api.student, api.studyrights)
  const [studyRights, studyAttainments, semesterEnrollments, courseEnrollments] = await Promise.all([
    formatStudyrights(api, studentnumber),
    formatStudyattainments(api, studentnumber),
    formatSemesterEnrollments(api, studentnumber),
    formatCourseEnrollments(api, studentnumber)
  ])
  return { studentInfo, studyRights, studyAttainments, semesterEnrollments, courseEnrollments }
}

const getMeta = async () => {
  const [faculties, courseRealisationsTypes, semesters, creditTypeCodes, courseTypeCodes, disciplines] = await Promise.all([
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
  getStudent, getMeta
}