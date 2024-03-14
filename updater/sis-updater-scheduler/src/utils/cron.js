const { CronJob } = require('cron')

const schedule = (cronTime, job) => new CronJob(cronTime, job, null, true, 'Europe/Helsinki')

module.exports = {
  schedule,
}
