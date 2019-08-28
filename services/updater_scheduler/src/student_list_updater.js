const Schedule = require('../models')
const { sleep, getStudentNumberChecksum } = require('./util')

const createTasks = async () => {
  console.log('Creating studentnumbers to DB...')

  const writeStudents = async (studentsToAdd) => {
    const tasks = studentsToAdd.map(student => ({ task: student, status: 'CREATED', type: 'student', active: true }))
    const bulkOperation = Schedule.collection.initializeUnorderedBulkOp()
    for (const task of tasks) {
      bulkOperation.insert(task)
    }
    await bulkOperation.execute()
  }

  const writeToDB = async (studentnumbers) => {
    try {
      await writeStudents(studentnumbers)
    } catch (err) {
      const BulkWriteResult = err.result.result
      const duplicateIndexError = 11000
      const realErrors = BulkWriteResult.writeErrors.filter(e => e.err.code !== duplicateIndexError)
      if (realErrors.length > 0 || BulkWriteResult.writeConcernErrors.length > 0) {
        console.log(err)
        return false
      }
    }
    return true
  }

  const minStudentNumber = 1010000
  const maxStudentNumber = 1530000
  const mongoWriteBatchSize = 1000
  let studentnumbers = []
  for (let i = minStudentNumber; i <= maxStudentNumber; ++i) {
    const studentNumber = '0' + i + getStudentNumberChecksum(i)
    studentnumbers.push(studentNumber)
    if ((studentnumbers.length % mongoWriteBatchSize) === 0 || i === maxStudentNumber) {
      console.log('current studentnumber', i)
      while (!await writeToDB(studentnumbers)) {
        await sleep(1*60*1000)
      }
      studentnumbers = []
    }
  }
  console.log('Studentnumbers created to DB')
}

module.exports = { createTasks }