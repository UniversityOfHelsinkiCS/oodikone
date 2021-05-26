const sisTrends = require('../servicesV2/trends')
const oodiTrends = require('../services/coolDataScience')

// Do the diff
const main = async () => {
  const showByYear = 'false'
  const unixMillis = '1622023958483' // default used in frontend
  const date = new Date(Number(unixMillis))
  date.setHours(23, 59, 59, 999)

  const oodiData = await oodiTrends.getStatus(date.getTime(), showByYear)
  const sisData = await sisTrends.getStatus(date.getTime(), showByYear)

  console.log("=== OODI === ")
  console.log(JSON.stringify(oodiData.H30, null, 2))
  
  console.log("=== SIS === ")
  console.log(JSON.stringify(sisData.H30, null, 2))
}

main()
