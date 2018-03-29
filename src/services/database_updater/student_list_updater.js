const oodi = require('./oodi_interface')
const util = require('../../util')
const { StudentList } = require('../../models')
const logger = require('../../util/logger')

/*
  run in staging with: 
  docker exec -it -e STUDENTS_FROM=1112000 -e STUDENTS_TO=1113000 staging_backend npm run update_studentnumbers_dev
*/

const arraysEqual = (a1, a2) => {
  return JSON.stringify(a1.sort()) === JSON.stringify(a2.sort())
}

const timestamp = () => {
  const d = new Date()
  const z = (t) => t < 10 ? '0' + t : t

  return`${z(d.getHours())}:${z(d.getMinutes())}:${z(d.getSeconds())}`
}

async function run () {
  const STUDENT_SET_KEY = process.env.STUDENT_SET || 'cached_students'
  const validStudents = []
  const minStudentNumber = process.env.STUDENTS_FROM || 1000000
  const maxStudentNumber = process.env.STUDENTS_TO || 1500000
  const step = process.env.STEP || 500 

  const range = maxStudentNumber - minStudentNumber

  logger.info('student numbers form '+ minStudentNumber + ' to ' + maxStudentNumber+  ' total of ' + range + ' students')
  logger.info('log message every '+ step + ' student')

  for (let i = minStudentNumber; i < maxStudentNumber; i++) {
    let studentNumber = '0' + i + util.getStudentNumberChecksum(String(i))

    if (i % step === 1) {
      const iteration = (1+(i - minStudentNumber) / step).toFixed()
      logger.info(iteration + '/' + (range / step + 1) + ' ' + timestamp() )
    }
    const student = await oodi.getStudent(studentNumber)
    if (student !== null && student !== undefined) {
      validStudents.push(student[0])
    } 
    
  }

  let cached = await StudentList.findOne({
    where: { key: STUDENT_SET_KEY }
  })

  if (cached === null) {
    cached = StudentList.build({
      key: STUDENT_SET_KEY,
      student_numbers: validStudents,
      description: `${minStudentNumber} to ${maxStudentNumber}`
    })
  } else if (!arraysEqual(cached.student_numbers, validStudents)) {
    logger.info('ERROR in student lists. There were ' + cached.student_numbers.length + ' students, was '+ cached.description)
    logger.info('found: valid ' + validStudents.length + ' out of ' + (maxStudentNumber - minStudentNumber))
    logger.info('student list cached')
    cached.student_numbers = validStudents
    cached.description = `${minStudentNumber} to ${maxStudentNumber}`
    await cached.save()
    process.exit(0)
  }

  await cached.save() 
  logger.info('found: valid '+ validStudents.length + ' out of '+ (maxStudentNumber - minStudentNumber))
  logger.info('student list cached')
  process.exit(0)
}

run()