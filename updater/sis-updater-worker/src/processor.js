const { postUpdate } = require('./postUpdate')
const { update } = require('./updater')
const { purgeByStudentNumber, prePurge, purge } = require('./updater/purge')

const updateMsgHandler = async updateMsg => {
  // TODO: Remove the following line after postUpdate is implemented correctly (worker.js calculates the processing time more accurately)
  const startTime = new Date()
  await update(updateMsg)
  await postUpdate(updateMsg, startTime)
}

module.exports = async job => {
  switch (job.name) {
    case 'students': {
      const studentNumbers = job.data.map(student => student.student_number)
      const msgInUpdateFormat = { type: job.name, entityIds: job.data.map(student => student.id) }
      await purgeByStudentNumber(studentNumbers)
      await updateMsgHandler(msgInUpdateFormat)
      break
    }
    case 'prepurge_start': {
      const count = await prePurge(job.data)
      return { counts: count, before: job.data.before }
    }
    case 'purge_start':
      await purge(job.data)
      break
    default:
      throw new Error(`Unknown job type: ${job.name}`)
  }
}
