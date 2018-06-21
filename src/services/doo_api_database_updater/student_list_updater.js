const _ = require('lodash')
const axios = require('axios')
const https = require('https')
const fs = require('fs')

const oodi = require('./oodi_interface')
const util = require('../../util')
const { StudentList } = require('../../models')
const logger = require('../../util/logger')

const timestamp = () => {
  const d = new Date()
  const z = (t) => t < 10 ? '0' + t : t

  return `${z(d.getHours())}:${z(d.getMinutes())}:${z(d.getSeconds())}`
}

const arraysEqual = (a1, a2) => {
  return JSON.stringify(a1.sort()) === JSON.stringify(a2.sort())
}

const agent = new https.Agent({
  cert: fs.readFileSync(process.env.CERT_PATH, 'utf8'),
  key: fs.readFileSync(process.env.KEY_PATH, 'utf8'),
})

const instance = axios.create()
instance.defaults.httpsAgent = agent

const options = {
  key: fs.readFileSync('./localhost.key', 'utf8'),
  cert: fs.readFileSync('./localhost.cert', 'utf8'),
  requestCert: false,
  rejectUnauthorized: false
}

const requestStudent = async (studentNumber) => {
  const url = `${process.env.OODI_ADDR}/students/${studentNumber}/info`
  const response = await instance.get(url)
  return response
}

async function run(incremental = true) {
  const STUDENT_SET_KEY = process.env.STUDENT_SET || 'cached_students'

  const validStudents = []
    
  let cached = await StudentList.findOne({
    where: { key: STUDENT_SET_KEY }
  })
  
  const minStudentNumber = (incremental && cached && cached.max) ? Number(cached.max) : 1010000
  const incremet = Number(process.env.INCREMENT) || 10000
  const maxStudentNumber = process.env.STUDENTS_TO || minStudentNumber + incremet || 1500000
  const step = process.env.STEP || 500

  const range = maxStudentNumber - minStudentNumber

  logger.info('student numbers form ' + minStudentNumber + ' to ' + maxStudentNumber + ' total of ' + range + ' student numbers')
  logger.info('log message every ' + step + ' student')

  for (let i = minStudentNumber; i < maxStudentNumber; i++) {
    let studentNumber = '0' + i + util.getStudentNumberChecksum(String(i))

    if (i % step === 1) {
      const iteration = (1 + (i - minStudentNumber) / step).toFixed()
      logger.info(iteration + '/' + (range / step + 1).toFixed(0)  + ' ' + timestamp())
    }
    
    const response = await requestStudent(studentNumber)
    if (response.data.data != null) {
      validStudents.push(studentNumber)
    }
  
  }

  console.log(validStudents.length) 
  logger.info('found and saved ' + validStudents.length + ' students')

  if (cached === null) {
    cached = StudentList.build({
      key: STUDENT_SET_KEY,
      student_numbers: validStudents,
      max: maxStudentNumber
    })
  } else if (!arraysEqual(cached.student_numbers, validStudents)) {
    logger.info('DIFFERENCE in student lists. There were ' + cached.student_numbers.length + ' students')
    logger.info('found: valid ' + validStudents.length + ' out of ' + (maxStudentNumber - minStudentNumber))

    cached.student_numbers = _.uniq(_.concat(validStudents, cached.student_numbers))
    cached.max = maxStudentNumber
    
    logger.info('total number of valid students in db ' + cached.student_numbers.length )

    logger.info('student list cached')
    await cached.save()
    process.exit(0)
  }

  await cached.save()
  logger.info('found: valid ' + validStudents.length + ' out of ' + (maxStudentNumber - minStudentNumber))
  logger.info('student list cached')

  process.exit(0)
}

run()