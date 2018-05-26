const util = require('./util')
const Oodi = require('./oodi_interface')
const StudentService = require('../students')
const StudyrightService = require('../studyrights')

async function main(studentNumber) {
  const student = await StudentService.byId(studentNumber)
  const studentCourseCreditsInOodi = await Oodi.getStudentCourseCredits(studentNumber)

  try {
    util.differenceWithOodi(studentCourseCreditsInOodi, student)
  } catch (e) {
    console.log(e)
  }
  
  const studyrightsWeboodi = await Oodi.getStudentStudyRights(studentNumber)

  const studyRightsOodiKone = await StudyrightService.byStudent(student.studentnumber)
  
  console.log('studyrights in weboodi')

  console.log(studyrightsWeboodi)
  console.log('in oodikone')
  console.log(JSON.stringify(studyRightsOodiKone, null, 2))

  console.log('weboodi', studyrightsWeboodi.length, 'oodikone', studyRightsOodiKone.length)

  process.exit(0)
}

if (process.argv.length>1) {
  main(process.argv[2])
}