

const faker = require('faker')
const moment = require('moment')
const mkdirp = require('mkdirp')
const getDirName = require('path').dirname
const logger = require('../util/logger')
const { disciplines } = require('./anonDisciplines')
const { studyRightCodes } = require('./anonStudyRights')
const oodi = require('./anon_oodi_interface')
const fs = require('fs')
const _ = require('lodash')
const status = require('node-status')

require('dotenv').config()
const startTime = moment()


let student_numbers = []

// few objects to save connections between anonymized and real data to keep relations.
let teacherRelations = {}
let studentRelations = {}
let learningOpportunityRelations = {}

const startCodesStatusBar = () => {
  status.start({ pattern: 'Running: {uptime.time} {spinner.monkey.blue} | {codes.bar} | codes anonymized: {codes}' })
}
const startStudentsStatusBar = () => {
  status.start({ pattern: 'Running: {uptime.time} {spinner.hearts.magenta} | {students.bar} | students anonymized: {students}' })
}
const startRealisationsStatusBar = () => {
  status.start({ pattern: 'Running: {uptime.time} {spinner.clock.red} | {realisations.bar} | realisations anonymized: {realisations}' })
}
const stopStatusBar = () => {
  status.stamp()
  status.stop()
}

const getAnonymizedTeacher = async (teacherId) => {
  if (teacherRelations[teacherId]) {
    return teacherRelations[teacherId]
  }
  let teacher = await oodi.getTeacher(teacherId)
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
  let student = await oodi.getStudent(id)
  let anonStudent = undefined
  if (student) {
    anonStudent = studentRelations[student.student_number]
  }
  if (!anonStudent) {
    anonStudent = {
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
  }
  if (!student) {
    return anonStudent
  }
  studentRelations[student.student_number] = anonStudent

  return anonStudent
}
const getRandomAmount = (attainments) => {
  const rate = (Math.random() * (0.375 - 0.05) + 0.05)
  const amount = Math.floor(rate * attainments.length)
  return amount
}
const dropRandomAttainments = (attainments) => {
  if (student_numbers.length < 1) {
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
    APIWriter(`./src/anonymized_API/teachers/${anonTeacher.teacher_id}/info`, { data: { data: anonTeacher } })
    anonTeachers = anonTeachers.concat(anonTeacher)
  }
  return anonTeachers
}

const anonymizeStudentAttainments = async (id, studentInfo, studentnumber_attainments) => {
  let attainments = await oodi.getStudyAttainments(id)
  attainments = dropRandomAttainments(attainments)
  attainments = addRandomAttainments(attainments, studentnumber_attainments)
  let anonAttainments = []
  for (let attainment of attainments) {
    let anonLearningOpportunity = learningOpportunityRelations[attainment.learningopportunity_id]
    if (!anonLearningOpportunity) {
      const learningOpportunity = await oodi.getLearningOpportunity(attainment.learningopportunity_id)
      if (learningOpportunity === null) {
        continue
      }
      anonLearningOpportunity = {
        ...learningOpportunity,
        disciplines: [disciplines.data.data[Math.floor(Math.random() * 12)]] ,
        learningopportunity_id: generateRandomId(),
        names: [
          {
            langcode: 'en',
            text: faker.company.bs()
          },
          {
            langcode: 'fi',
            text: faker.company.bs()
          }
        ],
        descriptions: [],
        materials: [],
        organisations: [],
        learningopportunity_internal: generateRandomId(),
        start_date: moment(learningOpportunity.start_date).add(_.sample([-3, 0, 3]), 'months').add(_.sample(Math.floor(Math.random() * 100) - 50, 'days')),
        end_date: moment(learningOpportunity.start_date).add(_.sample([-3, 0, 3]), 'months').add(_.sample(Math.floor(Math.random() * 100) - 50, 'days')).add(100, 'years'),
      }
      learningOpportunityRelations[attainment.learningopportunity_id] = anonLearningOpportunity
      APIWriter(`./src/anonymized_API/learningopportunities/${anonLearningOpportunity.learningopportunity_id}`, { data: { data: anonLearningOpportunity } })
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
      learningopportunity_id: anonLearningOpportunity.learningopportunity_id,
      learningopportunity_name: anonLearningOpportunity.names
    }
    anonAttainments = anonAttainments.concat(attainment)
  }
  return anonAttainments
}

const anonymizeStudentStudyRights = async (id, studentInfo) => {
  let studyRights = await oodi.getStudyRights(id)
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
const getElapsedTime = () => `${moment().diff(startTime, 'minutes')} m, ${moment().diff(startTime, 'seconds') / (moment().diff(startTime, 'minutes') * 60)} s.`
const anonymizeSemesterEnrollments = async (id) => {
  const data = await oodi.getSemesterEnrollments(id)
  let anonymizedData = []
  for (const enrollment of data) {
    anonymizedData = anonymizedData.concat({
      ...enrollment,
      yths_code: null,
      absence_reason_code: null,
      payment_amount: 100,
      yths_description: null,
      semester_enrollment_date: moment(moment(enrollment.semester_enrollment_date).format('YYYY-MM'), 'YYYY-MM'),
      payment_date: moment(moment(enrollment.payment_date).format('YYYY-MM'), 'YYYY-MM')
    })
  }
  return anonymizedData
}
const anonymizeStudent = async (id, student_numbers) => {
  const info = await anonymizeStudentInfo(id)

  const attainments = await anonymizeStudentAttainments(id, info, studentnumber_attainments)
  studentnumber_attainments = studentnumber_attainments.concat({ student_number: info.student_number, attainments: attainments })
  info.studyattainments = attainments.filter(attainment => ['Hyv.', '1', '2', '3', '4', '5'].includes(attainment.grade[0].text) && attainment.credits < 25).map(attainment => attainment.credits).reduce((acc, curr) => acc + curr, 0)

  const studyrights = await anonymizeStudentStudyRights(id, info)

  const semesterEnrollments = await anonymizeSemesterEnrollments(id)
  const infoPath = `./src/anonymized_API/students/${info.student_number}/info`
  const semesterEnrollmentPath = `./src/anonymized_API/students/${info.student_number}/semesterenrollments`
  const courseEnrollmentPath = `./src/anonymized_API/students/${info.student_number}/enrollments`
  const attainmentPath = `./src/anonymized_API/students/${info.student_number}/studyattainments`
  const studyRightPath = `./src/anonymized_API/students/${info.student_number}/studyrights`
  student_numbers = student_numbers.concat(info.student_number)

  APIWriter(infoPath, { data: { data: info } })
  APIWriter(studyRightPath, { data: { data: studyrights } })
  APIWriter(courseEnrollmentPath, { data: { data: [] } })
  APIWriter(attainmentPath, { data: { data: attainments } })
  APIWriter(semesterEnrollmentPath, { data: { data: semesterEnrollments } })
  return student_numbers
}
const anonymizeCourseUnitRealisations = async () => { 
  const courseUnitRealisations = await oodi.courseUnitRealisations()
  const realisationsCounter = status.addItem('realisations', { max: courseUnitRealisations.length })
  startRealisationsStatusBar()
  let anonRealisations = []
  for (const realisation of courseUnitRealisations) {
    continue
    realisationsCounter.inc()// eslint-disable-line
    if (!learningOpportunityRelations[realisation.learningopportunity_id]) {
      continue
    }
    const anonLearningId = learningOpportunityRelations[realisation.learningopportunity_id].learningopportunity_id
    const anonRealisation = {
      ...realisation,
      course_id: generateRandomId(),
      learningopportunity_id: anonLearningId
    }
    anonRealisations = anonRealisations.concat(anonRealisation)
    const courseUnitRealisation = await oodi.getCourseUnitRealisation(realisation.course_id)
    if (!courseUnitRealisation) {
      continue
    }
    let anonStudents = []
    for (const student of courseUnitRealisation.students) {
      if (student) {
        anonStudents = anonStudents.concat(await anonymizeStudentInfo(student.student_number))
      }
    }

    let anonTeachers = []
    for (const teacher of courseUnitRealisation.teachers) {
      anonTeachers = anonTeachers.concat(await getAnonymizedTeacher(teacher.teacher_id))
    }

    const anonCourseUnitRealisation = {
      ...courseUnitRealisation,
      realisation_name: learningOpportunityRelations[realisation.learningopportunity_id].names,
      students: anonStudents,
      providing_organisation: [],
      instruction_locality: [],
      events: [],
      officials: [],
      child_ids: [],
      courses_extra_organisations: [],
      teachers: anonTeachers, // note that new teachers created here are not populated in the API! (for future possible issues) regards: Saus 31.7.2018
      organisations: [],
      course_id: anonRealisation.course_id,
      providing_locality: [],
      learningopportunity_name: learningOpportunityRelations[realisation.learningopportunity_id].names,
      realisation_root_name: learningOpportunityRelations[realisation.learningopportunity_id].names,
      learningopportunity_id: learningOpportunityRelations[realisation.learningopportunity_id].learningopportunity_id,
      descriptions: [],
      languages: []
    }
    await APIWriter(`src/anonymized_API/courseunitrealisations/${anonCourseUnitRealisation.course_id}`, { data: { data: anonCourseUnitRealisation } })
  }
  await APIWriter('src/anonymized_API/courseunitrealisations/changes/ids/0000-12-24', { data: { data: anonRealisations } })
  stopStatusBar()
  return
}

const APIWriter = async (path, data) => {
  mkdirp(getDirName(path), async () => {
    fs.writeFile(path, JSON.stringify(data, null, 4), (error) => { if (error) { console.log(error) } })
    return 'succeeee'
  })
}


let studentnumber_attainments = []


const anonymize = async () => {
  logger.verbose(`starting time: ${startTime.format('HH:mm:ss')}`)
  const filename = './studentnumbers.txt'
  const readStudentNumbersFromFile = async filename => {
    let studentnumbers = fs.readFileSync(filename, 'utf-8').split('\n').map(s => s.replace(' ', ''))
    const randomCopies = _.sampleSize(studentnumbers, Math.floor((Math.random() * (1 - 0.33) + 0.33) * studentnumbers.length))
    studentnumbers = studentnumbers.concat(randomCopies)
    studentnumbers = _.shuffle(studentnumbers)
    return studentnumbers.filter(studentnumber => !!studentnumber)
  }
  const codeCounter = status.addItem('codes', { max: 5 })
  startCodesStatusBar()
  const semesters = { data: { data: await oodi.getSemesters() } }
  codeCounter.inc()
  const courseUnitRealisationsTypes = { data: { data: await oodi.getCourseRealisationTypes() } }
  codeCounter.inc()
  const creditTypeCodes = { data: { data: await oodi.getStudyattainmentStatusCodes() } }
  codeCounter.inc()
  const courseTypeCodes = { data: { data: await oodi.getCourseTypeCodes() } }
  codeCounter.inc()
  const courseDisciplines = disciplines 
  codeCounter.inc()
  await APIWriter('./src/anonymized_API/codes/semesters', semesters)
  await APIWriter('./src/anonymized_API/codes/courseunitrealisations/types', courseUnitRealisationsTypes)
  await APIWriter('./src/anonymized_API/codes/studyattainments/statuses', creditTypeCodes)
  await APIWriter('./src/anonymized_API/codes/learningopportunities/types', courseTypeCodes)
  await APIWriter('./src/anonymized_API/codes/learningopportunities/disciplines', courseDisciplines)
  const numberList = await readStudentNumbersFromFile(filename)
  const studentCounter = status.addItem('students', { max: numberList.length })
  status.stamp()
  startStudentsStatusBar()
  let student_numbers = []
  for (let id of numberList) {
    studentCounter.inc()
    try {
      student_numbers = await anonymizeStudent(id, student_numbers)
    } catch (error) {
      logger.verbose(`FAILED ${id}, ${error}  elapsed time:  ${getElapsedTime()}`)
      process.exit(1)
    }
  }
  status.stamp()
  await anonymizeCourseUnitRealisations()
  console.log(student_numbers)
  await APIWriter('./studentnumbersN.txt', student_numbers)
  logger.verbose(`end time: ${moment()}, total run-time:  ${getElapsedTime()}`)
}

anonymize()