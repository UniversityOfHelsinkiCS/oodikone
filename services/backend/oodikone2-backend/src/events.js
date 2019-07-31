const cron = require('node-cron')
const { refreshAssociationsInRedis } = require('./services/studyrights')
const { getAllProgrammes } = require('./services/studyrights')
const { productivityStatsForStudytrack, throughputStatsForStudytrack } = require('./services/studytrack')
const { calculateFacultyYearlyStats } = require('./services/faculties')
const { setProductivity, setThroughput, patchProductivity, patchThroughput, patchFacultyYearlyStats } = require('./services/analyticsService')

const refreshFacultyYearlyStats = async () => {
  try {
    console.log('Refreshing faculty yearly stats...')
    const data = await calculateFacultyYearlyStats()
    await patchFacultyYearlyStats(data)
  } catch (e) {
    console.error(e)
  }
}

const refreshStudyrightAssociations = async () => {
  try {
    console.log('Refreshing studyright associations...')
    await refreshAssociationsInRedis()
  } catch (e) {
    console.error(e)
  }
}

const refreshOverview = async () => {
  try {
    console.log('Refreshing overview...')
    const codes = (await getAllProgrammes()).map(p => p.code)
    let ready = 0
    for (const code of codes) {
      try {
        await patchThroughput({ [code]: { status: 'RECALCULATING' } })
        const since = new Date().getFullYear() - 5
        const data = await throughputStatsForStudytrack(
          code,
          since
        )
        await setThroughput(
          data
        )
      } catch (e) {
        try {
          await patchThroughput({ [code]: { status: 'RECALCULATION ERRORED' } })
        } catch (e) {
          console.error(
            e
          )
        }
        console.error(e)
        console.log(
          `Failed to update throughput stats for code: ${code}, reason: ${
            e.message
          }`
        )
      }
      try {
        await patchProductivity({ [code]: { status: 'RECALCULATING' } })
        const since = '2017-08-01'
        const data = await productivityStatsForStudytrack(code, since)
        await setProductivity(data)

      } catch (e) {
        try {
          await patchProductivity({
            [code]: { status: 'RECALCULATION ERRORED' }
          })
        } catch (e) {
          console.error(e)
        }
        console.error(e)
        console.log(`Failed to update productivity stats for code: ${code}, reason: ${e.message}`)
      }
      ready += 1
      console.log(
        `RefreshOverview ${ready}/${
          codes.length
        } done`
      )
    }
  } catch (e) {
    console.error(e)
  }
}

const timezone = 'Europe/Helsinki'

const startCron = () => {
  cron.schedule('0 6 * * *', async () => {
    await refreshFacultyYearlyStats()
    await refreshStudyrightAssociations()
    await refreshOverview()
  }, { timezone })
}

module.exports = {
  startCron
}
