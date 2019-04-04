const { findAndSaveTopTeachers } = require('./topteachers')

const TOPTEACHER = {
  task: 'update top teachers',
  computing: false,
  status: 'Not started',
  progress: undefined
}

const startTopTeacherUpdate = async (from, to) => {
  TOPTEACHER.computing = true
  TOPTEACHER.status = 'Update started'
  TOPTEACHER.progress = 0
  try {
    for (let year=from; year<=to; year++) {
      await findAndSaveTopTeachers(year)
      TOPTEACHER.status = `Top teachers from year with id ${year} updated.`
      TOPTEACHER.progress = ((year - from) / (to - from)) * 100
    }
  } catch (e) {
    TOPTEACHER.status = JSON.parse(e)
  }
  TOPTEACHER.computing = false
  TOPTEACHER.progress = 100
  TOPTEACHER.status = 'Update finished'
}

const getTaskStatus = () => ({ ...TOPTEACHER })

const getTeacherUpdateStatus = () => getTaskStatus()

module.exports = {
  getTaskStatus,
  startTopTeacherUpdate,
  getTeacherUpdateStatus
}
