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
 */
const studentServiceOodi = require('../../services/students')
const studentServiceSis = require('../../servicesV2/students')
const { compareStarted } = require('./compareMisc')
const getStudentNumbers = require('./getStudentNumbers')

const getStudentDiff = async studentNumber => {
  let msg = []
  const oodi = await studentServiceOodi.withId(studentNumber)
  const sis = await studentServiceSis.withId(studentNumber)

  msg = compareStarted(oodi.started, sis.started, msg)

  return msg
}

const main = async () => {
  const studentNumbers = await getStudentNumbers()

  console.log(`Comparing ${studentNumbers.length} students between Oodi and SIS databases.`)
  console.log('Only differing students and fields are printed.\n\n')

  for (const studentNumber of studentNumbers) {
    const msg = await getStudentDiff(studentNumber)

    if (msg.length) {
      console.log(`${studentNumber}:`)
      msg.forEach(s => {
        console.log(s)
      })
    }

    console.log('\n')
  }

  console.log('DONED.')
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch(() => {
    process.exit(1)
  })
