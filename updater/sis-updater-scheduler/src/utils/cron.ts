import { CronJob } from 'cron'

export const schedule = (cronTime: string, job: () => void) => new CronJob(cronTime, job, null, true, 'Europe/Helsinki')
