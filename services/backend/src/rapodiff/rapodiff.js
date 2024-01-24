/* eslint-disable no-unused-vars */
/* eslint no-console: 0 */

const { bscProgrammesOfFaculties } = require('./conf')
const { facultyDiff } = require('./studyrightDiff')
const { programmeCreditsDiff } = require('./creditsDiff')

const runFacultyStudyrightDiffs = async () => {
  console.log('Running faculty diffs.')
  for (let faculty of Object.keys(bscProgrammesOfFaculties)) {
    await facultyDiff(faculty, bscProgrammesOfFaculties[faculty], true)
  }

  // await programme_diff_year('KH55_001', 'H55', 2021, true)
  // await programme_diff('KH60_001', 'H60', true)
}

const runCreditDiffs = async () => {
  console.log('Running credit diffs.')
}

// ** To add new mode, just type key and function here **
const modes = { credits: () => programmeCreditsDiff('data.csv') } // { studyrights: runFacultyStudyrightDiffs, credits: runCreditDiffs }

const main = async () => {
  console.log('**RAPODIFF**\n')
  const mode = process.argv[2]
  const modeFunction = modes[mode]
  if (!modeFunction) {
    console.log(
      'Unknown or missing mode. Supply the mode as an argument. Supported modes:\n',
      Object.keys(modes).join('\n ')
    )
    return
  }
  await modeFunction()
}

main().then(() => process.exit(0))
