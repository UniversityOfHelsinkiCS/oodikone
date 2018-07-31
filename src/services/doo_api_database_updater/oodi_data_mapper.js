const moment = require('moment')
const _ = require('lodash')

const DEFAULT_TEACHER_ROLE = 'Teacher'

const getStudyRightIdStrings = (data) =>
  data['data'].map(elements => elements[0])

const getTextsByLanguage = texts => {
  const names = {}
  texts.forEach(text => names[text.langcode] = text.text)
  return { fi: null, sv: null, en: null, ...names }
}

const defaultNameFromTexts = texts => {
  const names = getTextsByLanguage(texts)
  return names.fi || names.en || names.sv
}

const jsonNamesFromTexts = texts => {
  const names = getTextsByLanguage(texts)
  return names
}

const universityEnrollmentDateFromStudyRights = studyRightArray => {
  return _.sortBy(studyRightArray.map(s => s.start_date), n =>
    moment(n).valueOf())[0]
}

const getStudentFromData = (student, studyrights) => {
  const city = getTextsByLanguage(student.city)
  const language = getTextsByLanguage(student.language)
  const country = getTextsByLanguage(student.country)
  return {
    studentnumber: student.student_number,
    email: student.email,
    phone: student.phone,
    city_fi: city.fi,
    city_sv: city.sv,
    national_student_number: student.national_student_number,
    zipcode: student.zipcode,
    address: student.address1,
    creditcount: student.studyattainments,
    address2: student.address2,
    birthdate: getDate(student.birth_date),
    language_fi: language.fi,
    language_sv: language.sv,
    language_en: language.en,
    age: student.age_years,
    lastname: student.last_name,
    mobile: student.mobile_phone,
    home_county_id: student.home_county_id,
    country_fi: country.fi,
    country_sv: country.sv,
    country_en: country.en,
    firstnames: student.first_names,
    communicationlanguage: language.en || language.fi || language.sv,
    dateofuniversityenrollment: universityEnrollmentDateFromStudyRights(studyrights),
    matriculationexamination: null,
    abbreviatedname: [student.last_name, student.first_names].join(' ')
  }
}

const getDate = (date, format = 'DD.MM.YYYY') => {
  if (!date) return null
  return moment(date, format).format('YYYY-MM-DD')
}

const getOrganisationFromData = ({ name, code }) => {
  return {
    code,
    name: jsonNamesFromTexts(name)
  }
}

const attainmentDataToCredit = (attainment, courseinstance_id, studentnumber) => {
  return {
    id: String(attainment.studyattainment_id),
    grade: defaultNameFromTexts(attainment.grade),
    credits: attainment.credits,
    ordering: getDate(attainment.attainment_date, null),
    credittypecode: attainment.attainment_status_code,
    courseinstance_id,
    student_studentnumber: studentnumber
  }
}

const attainmentDataToCourse = (attainment) => {
  const { learningopportunity_name, attainment_date } = attainment
  return {
    code: attainment.learningopportunity_id,
    name: jsonNamesFromTexts(learningopportunity_name),
    latest_instance_date: parseDate(attainment_date),
  }
}

const attainmentDataToCourseInstance = attainment => {
  return {
    coursedate: getDate(attainment.attainment_date, null),
    course_code: attainment.learningopportunity_id
  }
}

const studyAttainmentDataToModels = (data) => {
  const course = attainmentDataToCourse(data)
  const courseinstance = attainmentDataToCourseInstance(data)
  return [course, courseinstance]
}

const getTeacherFromData = teacher => ({
  id: teacher.teacher_id,
  code: teacher.userid,
  name: teacher.full_name
})

const ELEMENT_ID = {
  DEGREE_TITLE: 10,
  DEGREE_STUDY_PROGRAM: 20,
  DEGREE_MAJOR: 40,
}

const highlevelnameFromElements = elements => {
  let subject
  elements.forEach(element => {
    const name = defaultNameFromTexts(element.name)
    switch (element.element_id) {
    case ELEMENT_ID.DEGREE_STUDY_PROGRAM:
      subject = name
      break
    case ELEMENT_ID.DEGREE_MAJOR:
      if (subject === undefined) {
        subject = name
      }
      break
    default:
      break
    }
  })
  return `${subject}`
}

const parseDate = date => date && moment.utc(date, null).toDate()

const getStudyRightFromData = (data, studentNumber) => {
  return {
    studyrightid: `${data.studyright_id}`,
    canceldate: data.cancel_date,
    cancelorganisation: data.organisation_code,
    enddate: parseDate(data.end_date),
    extentcode: data.extent_code,
    givendate: parseDate(data.admission_date),
    graduated: Number(data.degree_date !== null),
    graduation_date: data.degree_date,
    highlevelname: highlevelnameFromElements(data.elements),
    prioritycode: data.priority,
    startdate: parseDate(data.start_date),
    studystartdate: parseDate(data.study_start_date),
    organization_code: data.organisation_code,
    student_studentnumber: studentNumber
  }
}

const elementDetailFromData = element => {
  const { code, name, element_id } = element
  const names = getTextsByLanguage(name)
  return {
    code,
    name: names,
    type: element_id
  }
}

const studyrightElementFromData = (element, studyrightid, studentnumber) => {
  const { start_date, end_date, code } = element
  return {
    code,
    studyrightid,
    studentnumber,
    startdate: start_date,
    enddate: end_date
  }
}

const courseTeacherFromData = (teacherid, courseinstanceid) => {
  return {
    teacherrole: DEFAULT_TEACHER_ROLE,
    courseinstance_id: courseinstanceid,
    teacher_id: teacherid,
  }
}

const attainmentDataToTeachers = data => data.teachers.map(teacherdata => ({
  id: teacherdata.teacher_id,
}))

const studyrightDataToExtent = data => ({
  extentcode: data.extent_code,
  name: getTextsByLanguage(data.extent)
})

const courseTypeFromData = data => ({
  coursetypecode: data.code,
  name: getTextsByLanguage(data.name)
})

const disciplineFromData = data => ({
  discipline_id: data.discipline_id,
  name: getTextsByLanguage(data.name)
})

const learningOpportunityDataToCourseDisciplines = data => data.disciplines.map(discipline => ({
  discipline_id: discipline.discipline_id,
  course_id: data.learningopportunity_id
}))

const learningOpportunityDataToCourse = data => ({
  code: data.learningopportunity_id,
  coursetypecode: data.learningopportunity_type_code,
  disciplines: data.disciplines,
  name: getTextsByLanguage(data.names)
})

const learningOpportunityDataToCourseProviders = data => {
  const providers = data.organisations.map(organisation => ({
    providercode: organisation.code,
    name: getTextsByLanguage(organisation.name)
  }))
  const courseproviders = providers.map(provider => ({
    providercode: provider.providercode,
    coursecode: data.learningopportunity_id
  }))
  return {
    providers,
    courseproviders
  }
}

const studyattainmentStatusCodeToCreditType = data => ({
  credittypecode: data.code,
  name: getTextsByLanguage(data.name)
})

const semesterFromData = data => ({
  semestercode: data.semester_code,
  name: getTextsByLanguage(data.name),
  startdate: parseDate(data.start_date),
  enddate: parseDate(data.end_date)
})

const semesterEnrollmentFromData = (data, studentnumber) => ({
  enrollmenttype: data.semester_enrollment_type_code,
  semestercode: data.semester_code,
  studentnumber
})

const getTransfersFromData = (data, studentnumber) => {
  const studytracks = data.elements.filter(element => element.element_id === 20)
  const sorted = _.sortBy(studytracks, 'end_date')
  let transfers = []
  let i = 0
  while (i < sorted.length) {
    if (i === 0) {
      i++
      continue
    }
    let target = sorted[i].code
    let source = sorted[i - 1].code
    let transferdate = sorted[i - 1].end_date

    transfers = transfers.concat({
      sourcecode: source,
      targetcode: target,
      transferdate,
      studentnumber,
      studyrightid: `${data.studyright_id}`})
    i++
  }
  return(transfers)
}

const courseRealisationTypeFromData = data => ({
  realisationtypecode: `${data.code}`,
  name: getTextsByLanguage(data.name)
})

const studentEnrollmentToModels = (data, studentnumber) => {
  const courserealisation = {
    courserealisation_id: `${data.course_id}`,
    startdate: parseDate(data.start_date),
    enddate: parseDate(data.end_date),
    coursecode: `${data.learningopportunity_id}`,
    name: getTextsByLanguage(data.name),
    realisationtypecode: `${data.type_code}`,
    parent: `${data.parent_id}`,
    root: `${data.root_id}`
  }
  const courseenrollment = {
    studentnumber,
    courserealisation_id: courserealisation.courserealisation_id
  }
  const course = {
    code: data.learningopportunity_id
  }
  return {
    courserealisation,
    courseenrollment,
    course
  }
}

const courseUnitRealisationDataToModels = data => {
  const courserealisation = {
    courserealisation_id: `${data.course_id}`,
    startdate: parseDate(data.start_date),
    enddate: parseDate(data.end_date),
    coursecode: `${data.learningopportunity_id}`,
    name: getTextsByLanguage(data.realisation_name),
    realisationtypecode: `${data.realisation_type_code}`,
    parent: `${data.parent_id}`,
  }
  const course = {
    code: courserealisation.coursecode,
  }
  const students = data.students.map(({ student_number }) => ({
    studentnumber: student_number
  }))
  const courseenrollments = students.map(student => ({
    studentnumber: student.studentnumber,
    courserealisation_id: courserealisation.courserealisation_id
  }))
  return {
    courserealisation,
    course,
    students,
    courseenrollments
  }
}

module.exports = {
  getStudentFromData,
  getStudyRightIdStrings,
  getStudyRightFromData,
  getDate,
  studyAttainmentDataToModels,
  getTeacherFromData,
  elementDetailFromData,
  studyrightElementFromData,
  attainmentDataToCourse,
  attainmentDataToCourseInstance,
  attainmentDataToCredit,
  getOrganisationFromData,
  courseTeacherFromData,
  attainmentDataToTeachers,
  studyrightDataToExtent,
  courseTypeFromData,
  learningOpportunityDataToCourse,
  studyattainmentStatusCodeToCreditType,
  disciplineFromData,
  learningOpportunityDataToCourseDisciplines,
  semesterFromData,
  semesterEnrollmentFromData,
  learningOpportunityDataToCourseProviders,
  getTransfersFromData,
  courseRealisationTypeFromData,
  studentEnrollmentToModels,
  courseUnitRealisationDataToModels
}