export const CHUNK_SIZE = Number(process.env.CHUNK_SIZE) || 100
export const isDev = process.env.NODE_ENV === 'development'
export const isStaging = process.env.STAGING === 'true'
export const isProduction = process.env.NODE_ENV === 'production'
export const SECRET_TOKEN = process.env.SECRET_TOKEN
export const DEV_SCHEDULE_COUNT: number | null = null // Set to a number to limit updater to update only DEV_SCHEDULE_COUNT amount of students
export const REDIS_LAST_HOURLY_SCHEDULE = 'LAST_HOURLY_SCHEDULE'
export const REDIS_LATEST_MESSAGE_RECEIVED = 'LATEST_MESSAGE_RECEIVED' // Where this is set?
export const LATEST_MESSAGE_RECEIVED_THRESHOLD = 1000 * 60 * 5
export const REDIS_LAST_WEEKLY_SCHEDULE = 'LAST_WEEKLY_SCHEDULE'
export const REDIS_LAST_PREPURGE_INFO = 'LAST_PREPURGE_INFO'
export const REDIS_HOST = process.env.REDIS_HOST
export const REDIS_PORT = Number(process.env.REDIS_PORT) || 6379

export const SIS_IMPORTER_HOST = process.env.SIS_IMPORTER_HOST
export const SIS_IMPORTER_PORT = Number(process.env.SIS_IMPORTER_PORT) || undefined
export const SIS_IMPORTER_USER = process.env.SIS_IMPORTER_USER
export const SIS_IMPORTER_PASSWORD = process.env.SIS_IMPORTER_PASSWORD
export const SIS_IMPORTER_DATABASE = process.env.SIS_IMPORTER_DATABASE

export const EXIT_AFTER_IMMEDIATES = process.env.EXIT_AFTER_IMMEDIATES === 'yes'
export const SCHEDULE_IMMEDIATE = process.env.SCHEDULE_IMMEDIATE ? process.env.SCHEDULE_IMMEDIATE.split(',') : []
export const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK
export const runningInCI = process.env.CI === 'true'
export const SENTRY_DSN = process.env.SENTRY_DSN
