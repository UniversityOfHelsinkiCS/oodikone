const { updateDatabase } = require('./database_updater')
const fs = require('fs')
const logger = require('../../util/logger')
const status = require('node-status')

const readStudentNumbersFromFile = async filename => {
  const studentnumbers = fs.readFileSync(filename, 'utf-8').split('\n').map(s => s.replace(/\D/g, ''))
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
  const divisor = Math.floor(total/nstamps)

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

const run = async (studentnumbersfile = 'studentnumbers.txt', index = 0, basiclogging = true) => {

  const args = parseArguments(process.argv)
  index = args.index || index
  basiclogging = args.basiclogging || basiclogging

  studentnumbersfile = args.file || studentnumbersfile
  logger.info('Student number source is: ' + studentnumbersfile)
  const readStudentnumbers = await readStudentNumbersFromFile(studentnumbersfile)
  const studentnumbers = readStudentnumbers.slice(index)

  const statuslogger = basiclogging ? basiclogger(studentnumbers) : fancylogger(studentnumbers)

  const started = new Date()
  let exitcode = 0

  try {
    statuslogger.start()
    await updateDatabase(studentnumbers, statuslogger.onUpdate)
    statuslogger.stop()
  } catch (e) {
    logger.verbose(e)
    exitcode = 1
  }
  const ended = new Date()
  logger.info(`Updater started/ended: \n${started} \n${ended}`)
  process.exit(exitcode)
}

run()