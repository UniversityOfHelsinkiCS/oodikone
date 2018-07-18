const { updateDatabase } = require('./database_updater')
const fs = require('fs')
const logger = require('../../util/logger')
const status = require('node-status')

const readStudentNumbersFromFile = async filename => {
  const studentnumbers = fs.readFileSync(filename, 'utf-8').split('\n').map(s => s.replace(/\D/g, ''))
  return studentnumbers.filter(studentnumber => !!studentnumber).map(s=>s.startsWith('0') ? s : '0'+s ) 
}

const createStudentCounter = studentnumbers => status.addItem('students', { max: studentnumbers.length })

const startStatusBar = () => {
  status.start({ pattern: 'Running: {uptime.time} {spinner.earth.green} | {students.bar} | students updated: {students}'})
}

const stopStatusBar = () => {
  status.stamp()
  status.stop()
}

const run = async (studentnumbersfile='studentnumbers.txt') => {
  const studentnumbers = await readStudentNumbersFromFile(studentnumbersfile)
  const counter = createStudentCounter(studentnumbers)
  const started = new Date()
  console.log(process.env)
  console.log({ started })
  startStatusBar()
  await updateDatabase(studentnumbers, () => counter.inc())
  stopStatusBar()
  const ended = new Date()
  logger.verbose(`Running script started/ended: \n${started} \n${ended}`)
  process.exit(0)
}

run()