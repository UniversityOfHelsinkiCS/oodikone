const Schedule = require('../models')

const getOldestTasks = async () => {
  const oldestTask = (await Schedule.find({ type: 'student' }).sort({ updatedAt: 1 }).limit(1))[0]
  const oldestActiveTask = (await Schedule.find({ type: 'student', active: true }).sort({ updatedAt: 1 }).limit(1))[0]
  const oldestMetaTask = (await Schedule.find({ type: 'other', task: 'meta' }).sort({ updatedAt: 1 }).limit(1))[0]
  const oldestAttainmentTask = (await Schedule.find({ type: 'other', task: 'attainment' }).sort({ updatedAt: 1 }).limit(1))[0]

  return {
    oldestChangedStatus: {
      studentnumber: oldestTask ? oldestTask.task : null,
      updatedAt: oldestTask ? oldestTask.updatedAt : null
    },
    oldestActiveStudentDone: {
      studentnumber: oldestActiveTask ? oldestActiveTask.task : null,
      updatedAt: oldestActiveTask ? oldestActiveTask.updatedAt : null
    },
    oldestMetaTask: {
      updatedAt: oldestMetaTask ? oldestMetaTask.updatedAt : null,
      status: oldestMetaTask ? oldestMetaTask.status : null
    },
    oldestAttainmentTask: {
      updatedAt: oldestAttainmentTask ? oldestAttainmentTask.updatedAt : null,
      status: oldestAttainmentTask ? oldestAttainmentTask.status : null
    }
  }
}

const getCurrentStatus = async () => {
  const allTasksScheduled = await Schedule.count({ type: 'student', status: 'SCHEDULED' })
  const allTasksFetched = await Schedule.count({ type: 'student', status: 'FETCHED' })
  const allTasksDone = await Schedule.count({ type: 'student', status: 'DONE' })
  const allTasksCreated = await Schedule.count({ type: 'student', status: 'CREATED' })
  const allTasksNoStudent = await Schedule.count({ type: 'student', status: 'NO_STUDENT' })
  const allTasksActive = await Schedule.count({ type: 'student', active: true })

  return { allTasksScheduled, allTasksFetched, allTasksDone, allTasksCreated, allTasksActive, allTasksNoStudent }
}

module.exports = { getOldestTasks, getCurrentStatus }