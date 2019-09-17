const { CronJob } = require('cron')
const { refreshAssociationsInRedis } = require('./services/studyrights')
const { getAllProgrammes } = require('./services/studyrights')
const {
  productivityStatsForStudytrack,
  throughputStatsForStudytrack,
  defaultStudyTrackSince
} = require('./services/studytrack')
const { calculateFacultyYearlyStats } = require('./services/faculties')
const {
  setProductivity,
  setThroughput,
  patchProductivity,
  patchThroughput,
  patchFacultyYearlyStats
} = require('./services/analyticsService')

const schedule = (cronTime, func) => new CronJob({ cronTime, onTick: func, start: true, timeZone: 'Europe/Helsinki' })

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
  const since = defaultStudyTrackSince()

  try {
    console.log('Refreshing overview...')
    const codes = (await getAllProgrammes()).map(p => p.code)
    let ready = 0
    for (const code of codes) {
      try {
        await patchThroughput({ [code]: { status: 'RECALCULATING' } })
        const data = await throughputStatsForStudytrack(code, since)
        await setThroughput(data)
      } catch (e) {
        try {
          await patchThroughput({ [code]: { status: 'RECALCULATION ERRORED' } })
        } catch (e) {
          console.error(e)
        }
        console.error(e)
        console.log(`Failed to update throughput stats for code: ${code}, reason: ${e.message}`)
      }
      try {
        await patchProductivity({ [code]: { status: 'RECALCULATING' } })
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
      console.log(`RefreshOverview ${ready}/${codes.length} done`)
    }
  } catch (e) {
    console.error(e)
  }
}

const startCron = () => {
  if (process.env.NODE_ENV === 'production') {
    schedule('0 6 * * *', async () => {
      await refreshFacultyYearlyStats()
      await refreshStudyrightAssociations()
      await refreshOverview()
    })
  }
}

module.exports = {
  startCron
}
