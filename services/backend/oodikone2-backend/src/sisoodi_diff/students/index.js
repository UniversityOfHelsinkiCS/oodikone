// Run with `npm run diff:students`
const studentServiceOodi = require('../../services/students')
const studentServiceSis = require('../../servicesV2/students')
const { objectDiff } = require('../utils')

// Fields that are not to be compared.
const ignoredFields = ['updatedAt']

const compareLength = (oodi, sis) => {
  if (!oodi.length) {
    return 'Length: N/A'
  }

  return `Length (oodi/sis): ${oodi.length} / ${sis.length}`
}

const getStudentDiff = async studentNumber => {
  const msg = []
  const oodi = await studentServiceOodi.withId(studentNumber)
  const sis = await studentServiceSis.withId(studentNumber)

  const diff = objectDiff(oodi, sis, ignoredFields)

  diff.forEach(field => {
    msg.push(`${field} diff:`)
    msg.push(`  ${compareLength(oodi[field], sis[field])}`)
  })

  return msg
}

const main = async () => {
  const studentNumbers = ['010690785', '011610159']

  console.log(`Comparing ${studentNumbers.length} students between Oodi and SIS databases.`)
  console.log('Only differing students and fields are printed.\n\n')

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
