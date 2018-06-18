const { updateDatabase } = require('./database_updater')
const fs = require('fs')
const logger = require('../../util/logger')

const readStudentNumbersFromFile = async filename => {
  logger.verbose(`Reading student numbers from file ${filename}.`)
  const studentnumbers = fs.readFileSync(filename, 'utf-8').split('\n').map(s => s.replace(' ',''))
  return studentnumbers.filter(studentnumber => !!studentnumber)  
}

const run = async (studentnumbersfile='studentnumbers.txt') => {
  const studentnumbers = await readStudentNumbersFromFile(studentnumbersfile)
  await updateDatabase(studentnumbers)
  process.exit(0)
}

run()