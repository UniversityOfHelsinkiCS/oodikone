/**
 * Usage:
 *
 * Compare 10 first students in students.csv:
 * npm run diff:students
 *
 * Compare `n` students in students.csv (max 1000):
 * npm run diff:students n 900
 *
 * Compare students filtering by study programme `code`:
 * npm run diff:students p <code>
 *
 * Compare students filtering by study programme `code` and starting `year`:
 * npm run diff:students p <code> <year>
 * E.g.: npm run diff:students KH50_005 2018
 *
 * Compare single student by student number:
 * npm run diff:students 123456789
 *
 * Options:
 *   csv    Output to a file.
 */
const studentServiceOodi = require('../../services/students')
const studentServiceSis = require('../../servicesV2/students')
const { compareCourses } = require('./compareCourses')
const getStudentNumbers = require('./getStudentNumbers')
const { output, makeCsv } = require('./output')

const getStudentDiff = async studentNumber => {
  let msg = []
  const oodi = await studentServiceOodi.withId(studentNumber)
  const sis = await studentServiceSis.withId(studentNumber)
  const courses = { oodi: oodi.courses, sis: sis.courses }

  //msg = compareStarted(oodi.started, sis.started, msg)
  //msg = compareCredits(oodi.credits, sis.credits, msg)
  msg = await compareCourses({ studentNumber, courses }, msg)

  return msg
}

const main = async () => {
  const studentNumbers = await getStudentNumbers()

  output(`Comparing ${studentNumbers.length} students between Oodi and SIS databases.`)
  output('Only differing students and fields are printed.\n\n')

  let okCount = 0

  for (const studentNumber of studentNumbers) {
    const msg = await getStudentDiff(studentNumber)

    output(`${studentNumber}: ${msg.length === 0 ? 'OK' : ''}`)
    msg.forEach(s => output(s))
    output('')

    if (msg.length === 0) {
      okCount++
    }
  }

  makeCsv()

  const total = studentNumbers.length
  const failed = studentNumbers.length - okCount
  const okPercent = ((okCount / total) * 100).toFixed(0)
  const failedPercent = ((failed / total) * 100).toFixed(0)

  output('Done.')
  output('\n--------------\nRUN STATISTICS\n--------------\n')
  output(`Total:\t\t${total} students`)
  output(`OK:\t\t${okCount} students\t(${okPercent} %)`)
  output(`Failed:\t\t${failed} students\t(${failedPercent} %)`)
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch(() => {
    process.exit(1)
  })
