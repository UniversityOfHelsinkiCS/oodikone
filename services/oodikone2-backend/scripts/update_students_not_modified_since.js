const logger = require('../src/util/logger')
const { Student } = require('../src/models/index')
const { updateStudentsTaskPooled } = require('../src/services/doo_api_database_updater/database_updater')
const { Op } = require('sequelize')

const studentsNotModifiedSince = async since => {
  const students = Student.findAll({
    attributes: ['studentnumber'],
    where: {
      updatedAt: {
        [Op.lt]: since
      }
    },
    raw: true
  })
  return students.map(({ studentnumber }) => studentnumber)
}

const basiclogger = (studentnumbers, nstamps = 100) => {

  const total = studentnumbers.length
  const divisor = Math.floor(total/nstamps)

  const dolog = iter => {
    if (iter % divisor === 0) {
      logger.info(`${new Date()} Students updated: ${iter}/${total}`)
    }
  }

  let iter = 0

  const start = () => {
    logger.info(`Updater started, students to update: ${total}. `)
  }

  const onUpdate = () => {
    iter += 1
    dolog(iter)
  }

  const stop = () => {
    logger.info('Updater finished. ')
  }

  return {
    start,
    stop,
    onUpdate
  }
}

const parseDateString = datestring => {
  if (!datestring) {
    throw Error('No datestring argument passed to script. Please pass a single datestring, e.g. 2018-08-20.')
  } else if (!Date.parse(datestring)) {
    throw Error(`${datestring} is not a valid Date. `)
  } else {
    return new Date(datestring)
  }
}

const updateStudents = async datestring => {
  const date = parseDateString(datestring)
  const studentnumbers = await studentsNotModifiedSince(date)
  if (!studentnumbers) {
    logger.verbose(`No studentnumbers found who have not been updated since ${datestring}. `)
  } else {
    const logger = basiclogger(studentnumbers)
    logger.start()
    await updateStudentsTaskPooled(studentnumbers, 50, logger.onUpdate)
    logger.stop()
  }
}

const run = async () => {
  try {
    await updateStudents(process.argv[2])
    process.exit(0)
  } catch (e) {
    logger.error(`Updater failed, error: ${e.message}`)
    process.exit(1)
  }
}

run()