const util = require('./util')
const Oodi = require('./oodi_interface')
const StudentService = require('../students')

async function main(studentNumber) {
  const student = await StudentService.byId(studentNumber)
  const studentCourseCreditsInOodi = await Oodi.getStudentCourseCredits(studentNumber)

  try {
    util.differenceWithOodi(studentCourseCreditsInOodi, student)
  } catch (e) {
    console.log(e)
  }
  
  process.exit(0)
}

if (process.argv.length>1) {
  main(process.argv[2])
}