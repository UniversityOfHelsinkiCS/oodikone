/* eslint no-console: 0 */

/*
  npm run rapodiff
*/

const { programmeCreditsDiff, testNewCalc } = require('./creditsDiff')

// ** To add new mode, just type key and function here **
const modes = {
  credits: () => programmeCreditsDiff('data.csv'),
  // Check credits with current local oodikone data against provided data.csv in rapodiff folder. data.csv can be downloaded from rapo by selecting all faculties, then from the bottom of the page clicking Export > data > csv.
  check: code => testNewCalc(code),
  // Provide programme code as argument. Parses credits from credits.csv in rapodiff folder. This must be obtained from Rapo people. This tells which credit ids are found in oodikone but not rapo, and vice versa.
  // notice: check mode requires writing ids in to the stats object in credits calculating function.
  // Add something like this there:
  // if (category === 'open-uni' && credits > 0 && new Date(attainmentDate).getFullYear() === 2022) stats.ids[id] = true
}

const main = async () => {
  console.log('**RAPODIFF**\n')
  const mode = process.argv[2]
  const modeFunction = modes[mode]
  const arg = process.argv[3]
  if (!modeFunction) {
    console.log(
      'Unknown or missing mode. Supply the mode as an argument. Supported modes:\n\n',
      Object.keys(modes).join('\n\n')
    )
    return
  }
  await modeFunction(arg)
}

main().then(() => process.exit(0))
