
const axios = require('axios')
const https = require('https')
const fs = require('fs')
const Schedule = require('../models')
const moment = require('moment')
const { sleep } = require('./util')
const { stan } = require('./nats_connection')

async function updateStudentNumberList() {
  stan.publish('status', JSON.stringify({ task: 'studentnumberlist', status: 'SCHEDULED' }), (err) => {
    if (err) {
      console.log('publish failed')
    }
  })
  const { KEY_PATH, CERT_PATH, TOKEN, NODE_ENV, OODI_ADDR, STUDENT_NUMBERS } = process.env
  const agent = KEY_PATH && CERT_PATH ?
    new https.Agent({
      cert: fs.readFileSync(CERT_PATH, 'utf8'),
      key: fs.readFileSync(KEY_PATH, 'utf8'),
    })
    :
    new https.Agent({
      rejectUnauthorized: false
    })

  const instance = axios.create({
    httpsAgent: agent
  })

  instance.defaults.httpsAgent = agent

  if (NODE_ENV === 'development') {
    instance.interceptors.request.use((config) => {
      config.params = {token: TOKEN}
      return config
    })
  }

  const getStudentNumberChecksum = studentNumber => {
    const studentNumberString = String(studentNumber)
    let checksumNumbers = [7, 3, 1]
    let checksum = 0

    for (let i = 0; i < studentNumberString.length; i++) {
      // go from end t start
      let currentNumber = studentNumberString[studentNumberString.length - (i + 1)]
      checksum += currentNumber * (checksumNumbers[i % checksumNumbers.length])
    }

    return (10 - (checksum % 10)) % 10
  }
  const requestStudent = async (studentNumber) => {
    const url = `${OODI_ADDR}/students/${studentNumber}/info`
    const response = await instance.get(url)
    return response
  }
  const currentSemester = Math.floor((moment(new Date()).diff(moment('1950', 'YYYY'), 'months')) / 6)

  const getActive = async (studentNumber) => {
    const url = `${OODI_ADDR}/students/${studentNumber}/semesterenrollments`
    const response = await instance.get(url)
    const enrollments = response.data.data
    if (enrollments) {
      const active = enrollments.find(e => e.semester_code === currentSemester && e.semester_enrollment_type_code === 1)
      return active ? true : false
    }
    return false
  }
  const writeStudents = async (studentsToAdd) => {
    let tasks = []
    for (const student of studentsToAdd) {
      const active = await getActive(student)
      tasks = [...tasks, ({ task: student, status: 'CREATED', type: 'student', active })]
    }
    const insertOrUpdateBulk = async (tasks) => {
      try {
        const bulkOperation = Schedule.collection.initializeUnorderedBulkOp()
        for (const task of tasks) {
          bulkOperation.find({ task: task.task }).upsert().updateOne(task)
        }
        await bulkOperation.execute()
        return true
      } catch (err) {
        console.log(err)
        return false
      }
    }
    await insertOrUpdateBulk(tasks)

    fs.appendFileSync(STUDENT_NUMBERS, studentsToAdd.join('\n').concat('\n'), (err) => {
      if (err) console.log(err)
    })
  }

  const allStudentsInDb = (await Schedule.find({ type: 'student' }).select('task -_id')).map(ob => ob.task.slice(1)) || []
  let minStudentNumber = 1010000
  // minStudentNumber = allStudentsInDb.length > 0 ? Number((allStudentsInDb.sort((a, b) => b - a)[0]) / 10).toFixed(0) : 1010000

  const maxStudentNumber = minStudentNumber + 500000
  let studentsToAdd = []
  console.log(`SEARCHING STUDENTS FROM ${minStudentNumber} TO ${maxStudentNumber}`)
  for (let i = minStudentNumber; i < maxStudentNumber;) {
    try {
      const studentNumber = '0' + i + getStudentNumberChecksum(i)
      const response = await requestStudent(studentNumber)
      if (!response.data.data || !response.data.data.student_number) continue
      if (allStudentsInDb.includes(response.data.data.student_number)) continue
      studentsToAdd = [...studentsToAdd, response.data.data.student_number]
      if (studentsToAdd.length % 1000 === 0) {
        try {
          await writeStudents(studentsToAdd)
        } catch (e) {
          console.log(e)
        }
        studentsToAdd = []
        console.log(`${i - minStudentNumber}/${maxStudentNumber - minStudentNumber} STUDENT LIST PROGRESS`)
      }
      i++
    } catch (err) {
      console.log(err)
      await sleep(1*60*1000)
    }
  }
  await writeStudents(studentsToAdd)

  stan.publish('status', JSON.stringify({ task: 'studentnumberlist', status: 'DONE' }), (err) => {
    if (err) {
      console.log('publish failed')
    }
  })
}
module.exports = { updateStudentNumberList }