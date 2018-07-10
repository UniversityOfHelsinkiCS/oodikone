const axios = require('axios')
const https = require('https')
const faker = require('faker')
const moment = require('moment')
const mkdirp = require('mkdirp')
const getDirName = require('path').dirname
const logger = require('./util/logger')
const fs = require('fs')
const _ = require('lodash')
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
const studyRightCodes =
{
  a: {
    name: 'Transfiguration',
    code: '666ABA'
  },
  b: {
    name: 'Defence Against the Dark Arts',
    code: '666ABB'
  },
  c: {
    name: 'Charms',
    code: '666ABC'
  },
  d: {
    name: 'Potions',
    code: '666ABD'
  },
  e: {
    name: 'Astronomy',
    code: '666ABE'
  },
  f: {
    name: 'History of Magic',
    code: '666ABF'
  },
  g: {
    name: 'Herbology',
    code: '666ABG'
  },
  h: {
    name: 'Arithmancy',
    code: '666ABH'
  },
  i: {
    name: 'Muggle Studies',
    code: '666ABI'
  },
  j: {
    name: 'Divination',
    code: '666ABJ'
  },
  k: {
    name: 'Study of Ancient Runes',
    code: '666ABK'
  },
  l: {
    name: 'Care of Magical Creatures',
    code: '666ABL'
  },
  m: {
    name: 'Alchemy',
    code: '666ABM'
  },
  bachelor: {
    name: 'Bachelors Degree on Witchcraft and Wizardry',
    code: '666bach'
  },
  master: {
    name: 'Master of Witchcraft and Wizardry',
    code: '666mast'
  }
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
const generateRandomId = () => String(Math.floor(Math.random() * (999999999 - 100000000 + 1) + 100000000))

const anonymizeStudentInfo = async (id) => {
  let student = await getStudent(id)
  student = {
    ...student,
    first_names: faker.name.firstName(),
    last_name: faker.name.lastName(),
    birthdate: new Date(moment(moment('1940', 'YYYY').valueOf() + Math.random() * (moment().subtract(17, 'years').valueOf() - moment('1940', 'YYYY').valueOf()))),
    email: faker.internet.email(),
    mobile_phone: faker.phone.phoneNumberFormat(),
    national_student_number: null,
    phone: faker.phone.phoneNumberFormat(),
    address1: faker.address.streetName(),
    address2: faker.address.streetName(),
    zipcode: faker.address.zipCode(),
    student_number: `0${Math.floor(Math.random() * (1999999 - 1000000 + 1) + 1000000)}`,
    person_id: generateRandomId(),
    city: [
      {
        langcode: 'en',
        text: 'Harlem'
      },
      {
        langcode: 'fi',
        text: 'Kajaani'
      }
    ],
    country: [
      {
        langcode: 'en',
        text: 'Canada'
      },
      {
        langcode: 'fi',
        text: 'Ruotsi'
      }
    ]
  }
  return student
}
const getRandomAmount = (attainments) => {
  const rate = (Math.random() * (0.375 - 0.05) + 0.05)
  const amount = Math.floor(rate * attainments.length)
  return amount
} 
const dropRandomAttainments = (attainments) => {
  if (student_numbers.length < 1){
    return attainments
  }
  const dropAmount = getRandomAmount(attainments)
  let i = 0
  while (i < dropAmount) {
    let randomIndex = Math.floor(Math.random() * (attainments.length))
    attainments.splice(randomIndex, 1)
    i++
  }
  return attainments
}
const addRandomAttainments = (attainments, studentnumber_attainments) => {
  if (studentnumber_attainments.length < 1) {
    return attainments
  }
  let studentnumbers = studentnumber_attainments.map(s => s.student_number)
  const addAmount = getRandomAmount(attainments)
  let i = 0
  while (i < addAmount) {
    let randomStudentNumber = _.sample(studentnumbers)
    let randomAttainment = _.sample(_.flattenDeep(studentnumber_attainments.filter(s => s.student_number === randomStudentNumber).map(s => s.attainments)))
    if (!randomAttainment) {
      continue
    }
    randomAttainment.semester_code = _.sample(attainments).semester_code // Make attainment happen at the same time as the students some other attainment.
    attainments = attainments.concat(randomAttainment)
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

const anonymizeStudentAttainments = async (id, studentInfo, studentnumber_attainments) => {

  let attainments = await getStudyAttainments(id)

  attainments = dropRandomAttainments(attainments)
  attainments = addRandomAttainments(attainments,studentnumber_attainments)
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
          },
          {
            langcode: 'fi',
            text: faker.company.bs()
          }
        ]
      }

      learningOpportunityRelations[attainment.learningopportunity_id] = learningOpportunity
    }

    let teachers = []
    teachers = await populateAnonymizedTeachers(attainment.teachers)

    // semester code is calculated as "code * 6 months since 1950-1-1", Im bucketing all study attainments in 3 month periods by semester code abstracting real study attainment dates
    const attainment_date = new Date(moment(moment('1950', 'YYYY').add((attainment.semester_code * 6) + _.sample([-3, 0, 3]), 'months')))
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
    let program = _.sample(['a', 'b', 'c', 'd', 'e', 'f', 'g'])
    let degree = 'bachelor'
    if (studyright.elements.some(element => element.name.some(name => name.text.includes('Master')))) {
      program = _.sample(['i', 'j', 'k', 'l', 'm', 'h'])
      degree = 'master'
    }
    const elements = studyright.elements.filter(element => element.element_id === 10 || element.element_id === 20).map(element => {
      if (element.element_id === 10) {
        return {
          ...element,
          code: studyRightCodes[degree].code,
          name: [
            {
              langcode: 'en',
              text: studyRightCodes[degree].name
            },
            {
              langcode: 'fi',
              text: studyRightCodes[degree].name
            }
          ]
        }
      } else if (element.element_id === 20) {
        return {
          ...element,
          code: studyRightCodes[program].code,
          name: [
            {
              langcode: 'en',
              text: studyRightCodes[program].name
            },
            {
              langcode: 'fi',
              text: studyRightCodes[program].name
            }
          ]
        }
      }
      return
    })

    let anonStudyright = {
      ...studyright,
      studyright_id: generateRandomId(),
      person_id: studentInfo.person_id,
      elements,
      organisation_name: [
        {
          langcode: 'en',
          text: 'Hogwarts School of Witchcraft and Wizardry'
        },
        {
          langcode: 'fi',
          text: 'Tylypahkan noitien ja velhojen koulu'
        }
      ]
    }
    anonStudyRights = anonStudyRights.concat(anonStudyright)
  }
  return anonStudyRights
}
const APIWriter = (path, data) => {
  mkdirp(getDirName(path), async () => {
    fs.writeFile(path, JSON.stringify(data, null, 4), (error) => { if (error) { console.log(error) } })
  })
}
let studentnumber_attainments = []
const anonymize = async () => {
  const filename = './studentnumbers.txt'
  const readStudentNumbersFromFile = async filename => {
    let studentnumbers = fs.readFileSync(filename, 'utf-8').split('\n').map(s => s.replace(' ', ''))
    const randomCopies = _.sampleSize(studentnumbers, Math.floor((Math.random() * (1-0.33)+0.33) * studentnumbers.length))
    studentnumbers = studentnumbers.concat(randomCopies)
    studentnumbers = _.shuffle(studentnumbers)
    return studentnumbers.filter(studentnumber => !!studentnumber)
  }
  const numberList = await readStudentNumbersFromFile(filename)
  for (let id of numberList) {
    logger.verbose(`Anonymizing ${id}`)
    try {
      const info = await anonymizeStudentInfo(id)
      const attainments = await anonymizeStudentAttainments(id, info, studentnumber_attainments)
      studentnumber_attainments = studentnumber_attainments.concat({student_number: info.student_number, attainments: attainments})
      info.studyattainments = attainments.filter(attainment => ['Hyv.','1', '2', '3', '4', '5'].includes(attainment.grade[0].text) && attainment.credits < 25).map(attainment => attainment.credits).reduce((acc, curr) => acc + curr, 0)
      const studyrights = await anonymizeStudentStudyRights(id, info)
      const infoPath = `./src/anonymized_API/students/${info.student_number}/info`
      const attainmentPath = `./src/anonymized_API/students/${info.student_number}/studyattainments`
      const studyRightPath = `./src/anonymized_API/students/${info.student_number}/studyrights`
      student_numbers = student_numbers.concat(info.student_number)
      APIWriter(infoPath, info)
      APIWriter(studyRightPath, studyrights)
      APIWriter(attainmentPath, attainments)
    } catch (error) {
      logger.verbose(`FAILED ${id}, ${error}`)
    }
  }
  APIWriter('./studentnumbersN.txt', student_numbers)


}

anonymize()