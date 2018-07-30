const { updateDatabase } = require('./database_updater')
const fs = require('fs')
const logger = require('../../util/logger')
const status = require('node-status')

const readStudentNumbersFromFile = async filename => {
  const studentnumbers = fs.readFileSync(filename, 'utf-8').split('\n').map(s => s.replace(/\D/g, ''))
  return studentnumbers.filter(studentnumber => !!studentnumber).map(s => s.startsWith('0') ? s : '0' + s)
}

const createStudentCounter = studentnumbers => status.addItem('students', { max: studentnumbers.length })

const startStatusBar = () => {
  status.start({ pattern: 'Running: {uptime.time} {spinner.earth.green} | {students.bar} | students updated: {students}' })
}

const stopStatusBar = () => {
  status.stamp()
  status.stop()
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

const run = async (studentnumbersfile = 'studentnumbers.txt', index = 0) => {
  const args = parseArguments(process.argv)
  index = args.index || index
  studentnumbersfile = args.file || studentnumbersfile
  const readStudentnumbers = await readStudentNumbersFromFile(studentnumbersfile)
  const studentnumbers = readStudentnumbers.slice(index)
  const counter = createStudentCounter(studentnumbers)
  const started = new Date()
  let exitcode = 0
  try {
    startStatusBar()
    await updateDatabase(studentnumbers, () => counter.inc())
  } catch (e) {
    logger.verbose(e)
    exitcode = 1
  }
  stopStatusBar()
  const ended = new Date()
  logger.verbose(`Running script started/ended: \n${started} \n${ended}`)
  process.exit(exitcode)
}

run()