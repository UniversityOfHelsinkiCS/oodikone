const { postUpdate } = require('./postUpdate')
const { update } = require('./updater')
const { purgeByStudentNumber, prePurge, purge } = require('./updater/purge')
const { loadMapsOnDemand } = require('./updater/shared')

const updateMsgHandler = async updateMsg => {
  // TODO: Remove the following line after postUpdate is implemented correctly (worker.js calculates the processing time more accurately)
  const startTime = new Date()
  await update(updateMsg)
  await postUpdate(updateMsg, startTime)
}

module.exports = async job => {
  switch (job.name) {
    case 'students_with_purge': {
      const studentNumbers = job.data.map(student => student.student_number)
      const msgInUpdateFormat = { type: 'students', entityIds: job.data.map(student => student.id) }
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
    case 'course_units':
    case 'credit_types':
    case 'curriculum_periods':
    case 'education_types':
    case 'organisations':
    case 'programme_modules':
    case 'students':
    case 'study_levels':
    case 'study_modules':
      await updateMsgHandler({ entityIds: job.data, type: job.name })
      break
    case 'reload_redis':
      await loadMapsOnDemand()
      break
    default:
      throw new Error(`Unknown job type: ${job.name}`)
  }
}
