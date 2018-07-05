const axios = require('axios')
const https = require('https')
const faker = require('faker')
const moment = require('moment')
const mkdirp = require('mkdirp')
const getDirName = require('path').dirname
const logger = require('./util/logger')
var fs = require('fs')
require('dotenv').config()


const instance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  })
})

axios.defaults.auth = {
  username: 'tktl',
}

axios.defaults.params = {
  token: process.env.TOKEN
}

let student_numbers = []

// few objects to save connections between anonymized and real data to keep relations.
let teacherRelations = {}
let learningOpportunityRelations = {}

const getStudent = (studentNumber) => {
  return instance.get(`${process.env.OODI_ADDR}/students/${studentNumber}/info`)
    .then(response => {
      return response.data.data
    })
    .catch(error => {
      return error
    })
}
const getStudyAttainments = async studentNumber => {
  const url = `${process.env.OODI_ADDR}/students/${studentNumber}/studyattainments`
  const response = await instance.get(url)
  return response.data.data
}
const getTeacher = async teacherId => {
  const url = `${process.env.OODI_ADDR}/teachers/${teacherId}/info`
  const response = await instance.get(url)
  return response.data.data
}
const getStudyRights = async studentNumber => {
  const url = `${process.env.OODI_ADDR}/students/${studentNumber}/studyrights`
  const response = await instance.get(url)
  return response.data.data
}
const getAnonymizedTeacher = async (teacherId) => {
  if (teacherRelations[teacherId]) {
    return teacherRelations[teacherId]
  }
  let teacher = await getTeacher(teacherId)
  const last_name = faker.name.lastName()
  const first_names = faker.name.firstName()
  teacher = {
    ...teacher,
    teacher_id: generateRandomId(),
    userid: faker.internet.userName(),
    last_name,
    first_names,
    calling_name: faker.name.firstName(),
    full_name: `${last_name} ${first_names}`,
    email: faker.internet.email(),
    mobile_phone: faker.phone.phoneNumberFormat()
  }
  teacherRelations[teacherId] = teacher
  return teacher
}
const generateRandomId = () => Math.floor(Math.random() * (999999999 - 100000000 + 1) + 100000000)

const anonymizeStudentInfo = async (id) => {
  let student = await getStudent(id)
  student = {
    ...student,
    first_names: faker.name.firstName(),
    last_name: faker.name.lastName(),
    // if no age years marked generate a random birth date between 1900 and 17 years before now
    birth_date: moment().subtract(student.age_years, 'years').format('YYYY-MM-DD') || moment(moment('1900', 'YYYY').getTime() + Math.random() * (moment().subtract(17, 'years').getTime() - moment('1900', 'YYYY').getTime())),
    email: faker.internet.email(),
    mobile_phone: faker.phone.phoneNumberFormat(),
    national_student_number: null,
    phone: faker.phone.phoneNumberFormat(),
    address1: faker.address.streetName(),
    address2: faker.address.streetName(),
    zipcode: faker.address.zipCode(),
    student_number: `0${Math.floor(Math.random() * (1999999 - 1000000 + 1) + 1000000)}`,
    person_id: generateRandomId()
  }
  return student
}
const dropRandomAttainments = (attainments) => {
  const dropRate = (Math.random() * (0.375 - 0.05) + 0.05)
  const dropAmount = Math.floor(dropRate * attainments.length)
  let i = 0
  while (i < dropAmount) {
    let randomIndex = Math.floor(Math.random() * (attainments.length))
    attainments.splice(randomIndex, 1)
    i++
  }
  return attainments
}
const populateAnonymizedTeachers = async (teachers) => {
  let anonTeachers = []
  for (let teacher of teachers) {
    let anonTeacher = await getAnonymizedTeacher(teacher.teacher_id)
    APIWriter(`./src/anonymized_API/teachers/${anonTeacher.teacher_id}/info`, anonTeacher)
    anonTeachers = anonTeachers.concat(anonTeacher)
  }
  return anonTeachers
}

const anonymizeStudentAttainments = async (id, studentInfo) => {

  let attainments = await getStudyAttainments(id)

  attainments = dropRandomAttainments(attainments)
  let anonAttainments = []
  for (let attainment of attainments) {

    let learningOpportunity = learningOpportunityRelations[attainment.learningopportunity_id]
    if (!learningOpportunity) {
      learningOpportunity = {
        learningopportunity_id: generateRandomId(),
        learningopportunity_name: [
          {
            langcode: 'en',
            text: faker.company.bs()
          }
        ]
      }

      learningOpportunityRelations[attainment.learningopportunity_id] = learningOpportunity
    }

    let teachers = []
    teachers = await populateAnonymizedTeachers(attainment.teachers)

    // semester code is calculated as "code * 6 months since 1950-1-1", Im bucketing all study attainments in 6 month periods by semester code abstracting real study attainment dates
    const attainment_date = moment(moment('1950', 'YYYY').add(attainment.semester_code * 6, 'months')).format('YYYY-MM-DD')
    attainment = {
      ...attainment,
      studyattainment_id: generateRandomId(),
      person_id: studentInfo.person_id,
      attainment_date,
      teachers,
      learningopportunity_id: learningOpportunity.learningopportunity_id,
      learningopportunity_name: learningOpportunity.learningopportunity_name
    }
    anonAttainments = anonAttainments.concat(attainment)
  }
  return anonAttainments
}
const anonymizeStudentStudyRights = async (id, studentInfo) => {
  let studyRights = await getStudyRights(id)
  let anonStudyRights = []
  for (let studyright of studyRights) {
    let anonStudyright = {
      ...studyright,
      person_id: studentInfo.person_id
    } 
    anonStudyRights = anonStudyRights.concat(anonStudyright)
  }
  return anonStudyRights
}
const APIWriter = (path, data) => {
  mkdirp(getDirName(path), async () => {
    fs.writeFile(path, JSON.stringify(data, null, 4), (error) => {if (error) {console.log(error)} })
  })
}

const anonymize = async () => {
  const filename = './studentnumbers.txt'
  const readStudentNumbersFromFile = async filename => {
    const studentnumbers = fs.readFileSync(filename, 'utf-8').split('\n').map(s => s.replace(' ', ''))
    return studentnumbers.filter(studentnumber => !!studentnumber)
  }
  const numberList = await readStudentNumbersFromFile(filename)
  for (let id of numberList) {
    logger.verbose(`Anonymizing ${id}`)
    try {
      const info = await anonymizeStudentInfo(id)
      const attainments = await anonymizeStudentAttainments(id, info)
      info.studyattainments = attainments.filter(attainment => ['1', '2', '3', '4', '5'].includes(attainment.grade[0].text) && attainment.credits < 25).map(attainment => attainment.credits).reduce((acc, curr) => acc + curr, 0)
      const studyrights = await anonymizeStudentStudyRights(id, info)
      const infoPath = `./src/anonymized_API/students/${info.student_number}/info`
      const attainmentPath = `./src/anonymized_API/students/${info.student_number}/studyattainments`
      const studyRightPath = `./src/anonymized_API/students/${info.student_number}/studyrights`
      student_numbers = student_numbers.concat(info.student_number)
      APIWriter(infoPath, info)
      APIWriter(studyRightPath, studyrights)
      APIWriter(attainmentPath, attainments)
    } catch(error) {
      logger.verbose(`FAILED ${id}, ${error}`)
    }
  }
  APIWriter('./studentnumbersN.txt', student_numbers)


}

anonymize()