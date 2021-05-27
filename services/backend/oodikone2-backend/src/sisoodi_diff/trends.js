const sisTrends = require('../servicesV2/trends')
const oodiTrends = require('../services/coolDataScience')

let printCourses = false

const recursiveDiff = (oodi, sis, level = 1) => {
  Object
    .keys(oodi).forEach(child => {
    if (oodi[child].drill) {
      if (level === 1) {
        console.log('\n====== Drilling to tiedekunta ', child, ' ======')
        console.log(oodi[child].name.fi)
      } else {
        console.log('\n=== Drilling to programme', child, '===')
        console.log(oodi[child].name.fi)
      }
      console.log('- amount of modules / courses in oodidata: ', Object.keys(oodi[child].drill).length)
      console.log('- amount of modules / courses in sisdata: ', Object.keys(sis[child].drill).length, '\n')
      console.log("- points in oodidata: ", oodi[child].current)
      console.log("- points in sisdata: ", sis[child].current)
      console.log("Total diff here: ", oodi[child].current - sis[child].current)
      recursiveDiff(oodi[child].drill, sis[child].drill, level + 1)
    } else {
      // Go through each years diff
      if (!sis[child]) {
        console.log("Doesn't exist in sis data: ", oodi[child].name.fi, ", ", child)
      } else if (printCourses) {
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

  // diff everything at module level
  recursiveDiff(oodiData, sisData)
}

main()
