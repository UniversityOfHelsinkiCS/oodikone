const { CronJob } = require('cron')
const moment = require('moment')
const { refreshAssociationsInRedis } = require('./services/studyrights')
const { refreshProtoC, refreshStatus, refreshUber, getStartYears } = require('./services/coolDataScience')
const { refreshAssociationsInRedis: refreshAssociationsInRedisV2 } = require('./servicesV2/studyrights')
const { getAllProgrammes, nonGraduatedStudentsOfElementDetail } = require('./services/studyrights')
const {
  getAllProgrammes: getAllProgrammesV2,
  nonGraduatedStudentsOfElementDetail: nonGraduatedStudentsOfElementDetailV2
} = require('./servicesV2/studyrights')
const { productivityStatsForStudytrack, throughputStatsForStudytrack } = require('./services/studytrack')

const {
  productivityStatsForStudytrack: productivityStatsForStudytrackV2,
  throughputStatsForStudytrack: throughputStatsForStudytrackV2
} = require('./servicesV2/studytrack')

const { calculateFacultyYearlyStats } = require('./services/faculties')
const topteachers = require('./services/topteachers')
const topteachersV2 = require('./servicesV2/topteachers')
const { isNewHYStudyProgramme } = require('./util')

const {
  setProductivity,
  setThroughput,
  patchProductivity,
  patchThroughput,
  patchFacultyYearlyStats,
  patchNonGraduatedStudents
} = require('./services/analyticsService')

const {
  setProductivity: setProductivityV2,
  setThroughput: setThroughputV2,
  patchProductivity: patchProductivityV2,
  patchThroughput: patchThroughputV2,
  patchNonGraduatedStudents: patchNonGraduatedStudentsV2
} = require('./servicesV2/analyticsService')

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

const refreshStudyrightAssociationsV2 = async () => {
  try {
    console.log('Refreshing studyright associations...')
    await refreshAssociationsInRedisV2()
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
      let programmeStatsSince = new Date('2017-07-31')
      if (code.includes('MH') || code.includes('KH')) {
        programmeStatsSince = new Date('2017-07-31')
      } else {
        programmeStatsSince = new Date('2000-07-31')
      }
      try {
        await patchThroughput({ [code]: { status: 'RECALCULATING' } })
        const data = await throughputStatsForStudytrack(code, programmeStatsSince.getFullYear())
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
        const data = await productivityStatsForStudytrack(code, programmeStatsSince)
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

const refreshOverviewV2 = async () => {
  try {
    console.log('Refreshing overview...')
    const codes = (await getAllProgrammesV2()).map(p => p.code)
    let ready = 0
    for (const code of codes) {
      let programmeStatsSince = new Date('2017-07-31')
      if (code.includes('MH') || code.includes('KH')) {
        programmeStatsSince = new Date('2017-07-31')
      } else {
        programmeStatsSince = new Date('2000-07-31')
      }
      try {
        // HERE
        await patchThroughputV2({ [code]: { status: 'RECALCULATING' } })
        const data = await throughputStatsForStudytrackV2(code, programmeStatsSince.getFullYear())
        // HERE
        await setThroughputV2(data)
      } catch (e) {
        try {
          // HERE
          await patchThroughputV2({ [code]: { status: 'RECALCULATION ERRORED' } })
        } catch (e) {
          console.error(e)
        }
        console.error(e)
        console.log(`Failed to update throughput stats for code: ${code}, reason: ${e.message}`)
      }
      try {
        // HERE
        await patchProductivityV2({ [code]: { status: 'RECALCULATING' } })
        const data = await productivityStatsForStudytrackV2(code, programmeStatsSince)
        // HERE
        await setProductivityV2(data)
      } catch (e) {
        try {
          // HERE
          await patchProductivityV2({
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

const refreshTeacherLeaderboard = async () => {
  try {
    const startyearcode = new Date().getFullYear() - 1950
    const endyearcode = startyearcode + 1
    console.log('Refreshing teacher leaderboard...')
    await topteachers.findAndSaveTeachers(startyearcode, endyearcode)
  } catch (e) {
    console.log(e)
  }
}

const refreshTeacherLeaderboardV2 = async () => {
  try {
    const startyearcode = new Date().getFullYear() - 1950
    const endyearcode = startyearcode + 1
    console.log('Refreshing teacher leaderboard...')
    await topteachersV2.findAndSaveTeachers(startyearcode, endyearcode)
  } catch (e) {
    console.log(e)
  }
}

const refreshNonGraduatedStudentsOfOldProgrammes = async () => {
  try {
    const oldProgrammeCodes = (await getAllProgrammes()).map(p => p.code).filter(c => !isNewHYStudyProgramme(c))
    let i = 0
    console.log('Refreshing non-graduated students of old programmes...')
    await Promise.all(
      oldProgrammeCodes.map(
        c =>
          new Promise(async res => {
            try {
              const [nonGraduatedStudents, studentnumbers] = await nonGraduatedStudentsOfElementDetail(c)
              await patchNonGraduatedStudents({ [c]: { formattedData: nonGraduatedStudents, studentnumbers } })
              console.log(`${++i}/${oldProgrammeCodes.length}`)
            } catch (e) {
              console.log(`Failed refreshing non-graduated students of programme ${c}!`)
            }
            res()
          })
      )
    )
  } catch (e) {
    console.log(e)
  }
}

const refreshNonGraduatedStudentsOfOldProgrammesV2 = async () => {
  try {
    const oldProgrammeCodes = (await getAllProgrammesV2()).map(p => p.code).filter(c => !isNewHYStudyProgramme(c))
    let i = 0
    console.log('Refreshing non-graduated students of old programmes...')
    await Promise.all(
      oldProgrammeCodes.map(
        c =>
          new Promise(async res => {
            try {
              const [nonGraduatedStudents, studentnumbers] = await nonGraduatedStudentsOfElementDetailV2(c)
              await patchNonGraduatedStudentsV2({ [c]: { formattedData: nonGraduatedStudents, studentnumbers } })
              console.log(`${++i}/${oldProgrammeCodes.length}`)
            } catch (e) {
              console.log(`Failed refreshing non-graduated students of programme ${c}!`)
            }
            res()
          })
      )
    )
  } catch (e) {
    console.log(e)
  }
}

const refreshProtoCtoRedis = async () => {
  try {
    const defaultQuery = { include_old_attainments: 'false', exclude_non_enrolled: 'false' }
    const onlyOld = { include_old_attainments: 'true', exclude_non_enrolled: 'false' }
    const onlyEnr = { include_old_attainments: 'false', exclude_non_enrolled: 'true' }
    const bothToggles = { include_old_attainments: 'true', exclude_non_enrolled: 'true' }
    console.log('Refreshing CDS ProtoC')
    await refreshProtoC(defaultQuery)
    await refreshProtoC(onlyOld)
    await refreshProtoC(onlyEnr)
    await refreshProtoC(bothToggles)
  } catch (e) {
    console.log(e)
  }
}

const refreshStatusToRedis = async () => {
  try {
    const unixMillis = moment().valueOf()
    const showByYearOff = 'false'
    const showByYear = 'true'
    console.log('Refreshing CDS Status')
    await refreshStatus(unixMillis, showByYearOff)
    await refreshStatus(unixMillis, showByYear)
  } catch (e) {
    console.log(e)
  }
}

const refreshUberToRedis = async () => {
  try {
    const years = await getStartYears()
    const mappedYears = years.map(({ studystartdate }) => studystartdate)
    mappedYears.forEach(async year => {
      console.log('Refreshing CDS Uber data for date', year)
      const defaultQuery = { include_old_attainments: 'false', start_date: year }
      const oldAttainmentsQuery = { include_old_attainments: 'true', start_date: year }
      await refreshUber(defaultQuery)
      await refreshUber(oldAttainmentsQuery)
    })
  } catch (e) {
    console.log(e)
  }
}

const refreshStatistics = async () => {
  await refreshFacultyYearlyStats()
  await refreshStudyrightAssociations()
  await refreshOverview()
  await refreshTeacherLeaderboard()
  await refreshNonGraduatedStudentsOfOldProgrammes()
}

const refreshStatisticsV2 = async () => {
  await refreshStudyrightAssociationsV2()
  await refreshOverviewV2()
  await refreshNonGraduatedStudentsOfOldProgrammesV2()
  await refreshTeacherLeaderboardV2()
}

const refreshCDS = async () => {
  await refreshProtoCtoRedis()
  await refreshStatusToRedis()
  await refreshUberToRedis()
}

const startCron = () => {
  if (process.env.NODE_ENV === 'production') {
    schedule('0 6 * * *', async () => {
      await refreshStatistics()
      await refreshCDS()
    })

    if (process.env.TAG === 'staging') {
      schedule('0 7 * * *', async () => {
        await refreshStatisticsV2()
      })
    }
  }
}

module.exports = {
  startCron,
  refreshStatistics,
  refreshStatisticsV2,
  refreshCDS
}
