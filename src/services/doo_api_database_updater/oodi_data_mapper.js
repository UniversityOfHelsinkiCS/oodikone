const moment = require('moment')
const _ = require('lodash')

const getStudyRightIdStrings = (data) =>
  data['data'].map(elements => elements[0])

const getTextsByLanguage = texts => {
  const names = {}
  texts.forEach(text => names[text.langcode] = text.text)
  return { fi: null, sv: null, en: null, ...names}
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
    //DEPRECATED IN NEW API
    communicationlanguage: language.en || language.fi || language.sv,
    dateoffirstcredit: null,
    dateoflastcredit: null,
    dateofuniversityenrollment: universityEnrollmentDateFromStudyRights(studyrights),
    gradestudent: null,
    matriculationexamination: null,
    nationalities: null,
    semesterenrollmenttypecode: null,
    sex: null,
    studentstatuscode: null,
    abbreviatedname: [student.last_name, student.first_names].join(' ')
  }
}

const getDate = (date, format = 'DD.MM.YYYY') => {
  if (!date) return null
  return moment(date, format).format('YYYY-MM-DD')
}


const statusFromAttainmentData = (code) => {
  switch (code) {
  case 1:
    return 'Based on a prior decision'
  case 2:
    return 'Planned'
  case 3:
    return 'Confirmed'
  case 4:
    return 'Completed'
  case 5:
    return 'Erroneous entry'
  case 6:
    return 'Outdated'
  case 7:
    return 'Improved (grade)'
  case 8:
    return 'In progress'
  case 9:
    return 'Transferred'
  case 10:
    return 'Failed'
  case 25:
    return 'Cancelled planned'
  default:
    return 'Undefined'
  }
}

const getOrganisationFromData = ({ name, code }) => {
  return {
    code, 
    name: jsonNamesFromTexts(name)
  }
}

const attainmentDataToCredit = (attainment, courseinstance_id) => {
  return {
    id: String(attainment.studyattainment_id),
    grade: defaultNameFromTexts(attainment.grade),
    credits: attainment.credits,
    ordering: getDate(attainment.attainment_date, null),
    status: statusFromAttainmentData(attainment.attainment_status_code),
    statuscode: attainment.attainment_status_code,
    courseinstance_id
  }
}

const attainmentDataToCourse = attainment => {
  const { learningopportunity_name, attainment_date} = attainment
  return {
    code: attainment.learningopportunity_id,
    name: jsonNamesFromTexts(learningopportunity_name),
    latest_instance_date: parseDate(attainment_date)
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
    switch(element.element_id) {
    case ELEMENT_ID.DEGREE_STUDY_PROGRAM:
      subject = name
      break    
    case ELEMENT_ID.DEGREE_MAJOR:
      if ( subject===undefined ) {
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

const studyrightElementFromData = (element, studyrightid) => {
  const { start_date, end_date, code } = element
  return {
    code,
    studyrightid,
    startdate: start_date,
    enddate: end_date
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
  getOrganisationFromData
}