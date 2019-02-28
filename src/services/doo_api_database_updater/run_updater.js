const { updateDatabase } = require('./database_updater')
const fs = require('fs')
const logger = require('../../util/logger')
const status = require('node-status')
const { getStudentNumbers } = require('../../models/queries')

const readStudentNumbersFromFile = async filename => {
  const studentnumbers = fs.readFileSync(filename, 'utf-8').split('\n').map(s => s.replace(/\D/g, ''))
  return studentnumbers.filter(studentnumber => !!studentnumber).map(s => s.startsWith('0') ? s : '0' + s)
}

const readStudentNumbersFromDb = async () => {
  const studentnumbers = await getStudentNumbers().map(s => s.studentnumber)
  return studentnumbers.filter(studentnumber => !!studentnumber).map(s => s.startsWith('0') ? s : '0' + s)
}


const parseArguments = (args) => {
  return args.slice(2).reduce((args, arg) => {
    const split = arg.split('=')
    if (split[0] === 'file') {
      args.file = split[1]
    } else if (split[0] === 'index') {
      args.index = split[1]
    }
    return args
  }, {})

}

const fancylogger = (studentnumbers) => {

  const counter = status.addItem('students', { max: studentnumbers.length })

  const start = () => {
    status.start({
      pattern: 'Running: {uptime.time} {spinner.earth.green} | {students.bar} | students updated: {students}'
    })
  }

  const stop = () => {
    status.stamp()
    status.stop()
  }

  const onUpdate = () => {
    counter.inc()
  }

  return {
    start,
    stop,
    onUpdate
  }
}

const basiclogger = (studentnumbers, nstamps = 100) => {

  const total = studentnumbers.length
  const divisor = Math.floor(total / nstamps)

  const dolog = iter => {
    if (iter % divisor === 0) {
      logger.info(`${new Date()} Students updated: ${iter}/${total}`)
    }
  }

  let iter = 0

  const start = () => {
    logger.info('Updater started. ')
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

const run = async (index = 0, basiclogging = true) => {

  const args = parseArguments(process.argv)
  index = args.index || index
  basiclogging = args.basiclogging || basiclogging

  let studentnumberssource
  let readStudentnumbers

  if (args.file) {
    studentnumberssource = args.file
    readStudentnumbers = await readStudentNumbersFromFile(studentnumberssource)
  } else {
    studentnumberssource = 'database'
    readStudentnumbers = await readStudentNumbersFromDb()
  }

  const studentnumbers = readStudentnumbers.slice(index)

  logger.info('Student number source is: ', studentnumberssource)

  const statuslogger = basiclogging ? basiclogger(studentnumbers) : fancylogger(studentnumbers)

  const started = new Date()
  let exitcode = 0

  try {
    statuslogger.start()
    await updateDatabase(studentnumbers, statuslogger.onUpdate)
    statuslogger.stop()
  } catch (e) {
    logger.verbose(e.message)
    exitcode = 1
  }
  const ended = new Date()
  logger.info(`Updater started/ended: \n${started} \n${ended}`)
  process.exit(exitcode)
}

run()