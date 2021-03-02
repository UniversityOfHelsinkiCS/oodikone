// Run with `npm run diff:students`
const studentServiceOodi = require('../../services/students')
const studentServiceSis = require('../../servicesV2/students')
const { objectDiff } = require('../utils')

console.log('Comparing students between Oodi and SIS databases.\n\n')

// Fields that are not to be compared.
const ignoredFields = ['updatedAt']

const getStudentDiff = async studentNumber => {
  const msg = []
  const res = await studentServiceOodi.withId(studentNumber)
  const resSis = await studentServiceSis.withId(studentNumber)

  const diff = objectDiff(res, resSis, ignoredFields)

  diff.forEach(field => {
    msg.push(`${field} diff:`)
    msg.push(`  Length (oodi/sis): ${res[field].length} / ${resSis[field].length}`)
  })

  return msg
}

const main = async () => {
  const studentNumbers = ['010690785', '011610159']

  for (const studentNumber of studentNumbers) {
    const msg = await getStudentDiff(studentNumber)

    if (msg.length) {
      console.log(`${studentNumber}:`)
      msg.forEach(s => {
        console.log(`  ${s}`)
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
