const CronJob = require('cron').CronJob

const schedule = (cronTime, job) => new CronJob(cronTime, job, null, true, 'Europe/Helsinki')

module.exports = {
  schedule,
}
