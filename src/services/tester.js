const { yearlyStatsOf } = require('./courses')

const run = async () => {
  await yearlyStatsOf('TKT10002', { start: 2017, end: 2018 }, 'true', 'fi')
  process.exit()
}

run()