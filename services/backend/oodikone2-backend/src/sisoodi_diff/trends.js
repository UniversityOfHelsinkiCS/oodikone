const sisTrends = require('../servicesV2/trends')
const oodiTrends = require('../services/coolDataScience')

const recursiveDiff = (oodi, sis) => {
  Object.keys(oodi).forEach(child => {
    if (oodi[child].drill) {
      console.log('\n=== Drilling to ', child)
      console.log('- amount of modules / courses in oodidata: ', Object.keys(oodi[child].drill).length)
      console.log('- amount of modules / courses in sisdata: ', Object.keys(sis[child].drill).length, '\n')
      recursiveDiff(oodi[child].drill, sis[child].drill)
    } else {
      // Go through each years diff
      if (!sis[child]) {
        console.log("Doesn't exist in sis data: ", oodi[child].name.fi)
      } else {
        Object.keys(oodi[child].yearly).forEach(year => {
          const oodiCredits = oodi[child].yearly[year].acc
          const sisCredits = sis[child].yearly[year].acc
          if (oodiCredits != sisCredits) {
            console.log('=== Acc diffs for ', oodi[child].name.fi)
            console.log('Oodi: ', oodiCredits)
            console.log('Sis: ', sisCredits)
          }
        })
      }
    }
  })
}

// Do the diff
const main = async () => {
  const showByYear = 'false'
  const unixMillis = '1622023958483' // default used in frontend
  const date = new Date(Number(unixMillis))
  date.setHours(23, 59, 59, 999)

  const oodiData = await oodiTrends.getStatus(date.getTime(), showByYear)
  const sisData = await sisTrends.getStatus(date.getTime(), showByYear)

  // diff lääkis
  recursiveDiff(oodiData.H30.drill, sisData.H30.drill)
}

main()
