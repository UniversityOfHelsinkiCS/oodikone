const EventEmitter = require('events')
const { findAndSaveTopTeachers } = require('./topteachers')

const TOPTEACHER = {
  task: 'update top teachers',
  computing: false,
  status: 'Not started',
  progress: undefined
}

const emitter = new EventEmitter()

const publish = (payload) => {
  emitter.emit(TOPTEACHER.task, payload)
}

const subscribe = (callback) => emitter.on(TOPTEACHER.task, callback)

const startTopTeacherUpdate = async (from, to) => {
  TOPTEACHER.computing = true
  TOPTEACHER.status = 'Update started'
  TOPTEACHER.progress = 0
  publish(TOPTEACHER)
  try {
    for (let year=from; year<=to; year++) {
      await findAndSaveTopTeachers(year)
      TOPTEACHER.status = `Top teachers from year with id ${year} updated.`
      TOPTEACHER.progress = (from / (to - from))
      publish(TOPTEACHER)
    }
  } catch (e) {
    TOPTEACHER.status = JSON.parse(e)
    publish(TOPTEACHER)
  }
  TOPTEACHER.computing = false
  TOPTEACHER.progress = 100
  TOPTEACHER.status = 'Update finished'
  publish(TOPTEACHER)
}

const getTaskStatus = () => ({ ...TOPTEACHER })

const getTeacherUpdateStatus = () => getTaskStatus(TOPTEACHER)

module.exports = {
  getTaskStatus,
  startTopTeacherUpdate,
  getTeacherUpdateStatus,
  subscribe
}
