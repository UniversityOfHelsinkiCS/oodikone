const { updateDatabase } = require('./database_updater_new')
const fs = require('fs')
const logger = require('../../util/logger')

const readStudentNumbersFromFile = async filename => {
  logger.verbose(`Reading student numbers from file ${filename}.`)
  const studentnumbers = fs.readFileSync(filename, 'utf-8').split('\n').map(s => s.replace(/\D/g, ''))
  return studentnumbers.filter(studentnumber => !!studentnumber).map(s=>s.startsWith('0') ? s : '0'+s ) 
}

const run = async (studentnumbersfile='studentnumbers.txt') => {
  const studentnumbers = await readStudentNumbersFromFile(studentnumbersfile)
  const started = new Date()
  await updateDatabase(studentnumbers)
  const ended = new Date()
  logger.verbose(`Running script started/ended: \n${started} \n${ended}`)
  process.exit(0)
}

run()