const moment = require('moment')

const getStudyRightIdStrings = (data) =>
  data['data'].map(elements => elements[0])

const getTextsByLanguage = texts => {
  const names = {}
  texts.forEach(text => names[text.langcode] = text.text)
  return { fi: null, sv: null, en: null, ...names}
}

const getStudentFromData = (student) => {
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
    dateofuniversityenrollment: null,
    gradestudent: null,
    matriculationexamination: null,
    nationalities: null,
    semesterenrollmenttypecode: null,
    sex: null,
    studentstatuscode: null,
    abbreviatedname: [student.last_name, student.first_names].join(', ')
  }
}

const getOrganisationFromData = (data) => {
  let organisation = []
  organisation['code'] = data['data'][1]
  organisation['name'] = data['data'][4] != null ? data['data'][4] : data['data'][2]
  return organisation
}

const getCourseCreditsFromData = (data) =>
  data['data'].map((courseData) => {
    return {
      credits: courseData[3],
      grade: courseData[4],
      status: courseData[5],
      statusCode: courseData[6],
      ordering: courseData[7],
      courseInstance: {
        date: courseData[0],
        course: {
          courseCode: courseData[1],
          courseName: courseData[2]
        }
      }
    }
  })

const getStudentNumbersFromProgramData = (data) => {
  let studentNumbers = []
  data['data'].forEach((student) => {
    studentNumbers.push(student[1])
  })
  return studentNumbers
}

const getDate = (date, format = 'DD.MM.YYYY') => {
  if (!date) return null
  return moment(date, format).format('YYYY-MM-DD')
}

const getTeachersAndRolesFromData = (teacherDetailData) => {
  let teachers = []
  teacherDetailData.forEach(teacher => {
    let role
    if (teacher[0] === '1') {
      role = 'Approver'
    } else if (teacher[0] === '2') {
      role = 'Teacher'
    } else if (teacher[0] === '3') {
      role = 'Responsible'
    } else {
      role = 'Unknown'
    }
    const code = teacher[1]
    const name = teacher[2]
    const t = { 'code': code, 'name': name, 'role': role }
    teachers.push(t)
  })
  return teachers
}

const englishTextFromGrade = grade => grade[2].text

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

const attainmentDataToCredit = attainment => {
  return {
    id: attainment.studyattainment_id,
    grade: englishTextFromGrade(attainment.grade),
    credits: attainment.credits,
    ordering: getDate(attainment.attainment_date, null),
    status: statusFromAttainmentData(attainment.attainment_status_code),
    statuscode: attainment.attainment_status_code,
    courseinstance_id: attainment.learningopportunity_id,
  }
}

const attainmentDataToCourse = attainment => {
  const { learningopportunity_name, attainment_date} = attainment
  const names = getTextsByLanguage(learningopportunity_name)
  return {
    code: attainment.learningopportunity_id,
    name: names.en || names.fi || names.sv,
    latest_instance_date: parseDate(attainment_date)
  }
}

const attainmentDataToCourseInstance = attainment => {
  let teacher_id = undefined
  if (attainment.teachers.length > 0) {
    teacher_id = attainment.teachers[0].teacher_id 
  }
  return {
    coursedate: getDate(attainment.attainment_date, null),
    course_code: attainment.learningopportunity_id,
    teacherid: teacher_id
  }
}

const studyAttainmentDataToModels = (data) => {
  const credit = attainmentDataToCredit(data)
  const course = attainmentDataToCourse(data)
  const courseinstance = attainmentDataToCourseInstance(data)
  return [credit, course, courseinstance]
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
  let degree, subject
  elements.forEach(element => {
    const names = getTextsByLanguage(element.name)
    switch(element.element_id) {
    case ELEMENT_ID.DEGREE_TITLE:
      degree = names.en || names.fi || names.sv
      break
    case ELEMENT_ID.DEGREE_STUDY_PROGRAM:
      subject = names.en || names.fi || names.sv
      break    
    case ELEMENT_ID.DEGREE_MAJOR:
      if ( subject===undefined ) {
        subject = names.en || names.fi || names.sv
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

module.exports = {
  getStudentFromData,
  getStudyRightIdStrings,
  getStudyRightFromData,
  getOrganisationFromData,
  getCourseCreditsFromData,
  getStudentNumbersFromProgramData,
  getDate,
  getTeachersAndRolesFromData,
  studyAttainmentDataToModels,
  getTeacherFromData
}