const { programmeCreditsDiff, testNewCalc } = require('./creditsDiff')

// ** To add new mode, just type key and function here **
const modes = {
  // Check credits with current local oodikone data against provided data.csv in rapodiff folder.
  credits: () => programmeCreditsDiff('data.csv'),
  // Provide programme code as argument. Parses credits from credits.csv in rapodiff folder. This must be obtained from Rapo people. This tells which credit ids are found in oodikone but not rapo, and vice versa.
  // notice: check mode requires writing ids in to the stats object in credits calculating function.
  // Add something like this there:
  // if (category === 'open-uni' && credits > 0 && new Date(attainmentDate).getFullYear() === 2022) stats.ids[id] = true
  check: (fileName, code, field) => testNewCalc(fileName, code, field),
}

const main = async () => {
  console.log('**RAPODIFF**\n')
  const mode = process.argv[2]
  const modeFunction = modes[mode]
  const arg = process.argv[3]
  const arg2 = process.argv[4]
  const arg3 = process.argv[5]
  if (!modeFunction) {
    console.log(
      'Unknown or missing mode. Supply the mode as an argument (e.g. `npm run rapodiff -- credits`). Supported modes:\n'
    )
    console.log(Object.keys(modes).join('\n'))
    return
  }
  await modeFunction(arg, arg2, arg3)
}

main().then(() => process.exit(0))
