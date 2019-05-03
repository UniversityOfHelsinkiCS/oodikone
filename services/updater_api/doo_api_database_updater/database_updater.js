const Oodi = require('./oodi_interface')
const mapper = require('./oodi_data_mapper')

const _ = require('lodash')

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
const updateStudyrights = async (api, studentnumber) => {
  if (api.studyrights.length === 0) {
    console.log(`No studyrights for ${studentnumber}`)
    return
  }
  for (let data of api.studyrights) {
    const studyRightExtent = mapper.studyrightDataToExtent(data)
    const studyright = mapper.getStudyRightFromData(data, studentnumber)
    let elementDetails = []
    let studyRightElements = []
    for (let element of data.elements) {
      elementDetails = [...elementDetails, mapper.elementDetailFromData(element)]
      studyrightElements = [...studyRightElements, mapper.studyrightElementFromData(element, studyright.studyrightid, studentnumber)]
    }
    const transfers = mapper.getTransfersFromData(data, studentnumber)
    return { studyRightExtent, studyright, elementDetails, studyRightElements, transfers }
  }
}

const updateCourseEnrollments = async (apidata, studentnumber) => await Promise.all(apidata.courseEnrollments.map(enrollment => mapper.studentEnrollmentToModels(enrollment, studentnumber)))


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

const updateStudyattainments = async (api, studentnumber) => {
  let studyAttainments = []
  for (let data of api.studyattainments) {
    const { credit, teachers, course } = parseAttainmentData(data, studentnumber)

    studyAttainments = [
      ...studyAttainments, {
        credit: (credit.semestercode ? credit : { ...credit, semestercode: mapper.getSemesterCode(credit.attainment_date) }),
        creditTeachers: await createCreditTeachers(credit, teachers), teachers,
        course
      }
    ]
  }
  return studyAttainments
}

const updateSemesterEnrollments = async (apidata, studentnumber) => await Promise.all(apidata.semesterEnrollments.map(apiEnrollment => mapper.semesterEnrollmentFromData(apiEnrollment, studentnumber)))


const updateStudent = async (studentnumber) => {
  const api = await getAllStudentInformationFromApi(studentnumber)
  if (api.student === null || api.student === undefined) {
    throw new Error(`API returned ${api.student} for studentnumber ${studentnumber}.`)
  }
  const studentInfo = await mapper.getStudentFromData(api.student, api.studyrights)
  const [studyRights, studyAttainments, semesterEnrollments, courseEnrollments] = await Promise.all([
    updateStudyrights(api, studentnumber),
    updateStudyattainments(api, studentnumber),
    updateSemesterEnrollments(api, studentnumber),
    updateCourseEnrollments(api, studentnumber)
  ])
  return { studentInfo, studyRights, studyAttainments, semesterEnrollments, courseEnrollments }
}





module.exports = {
  updateStudent
}