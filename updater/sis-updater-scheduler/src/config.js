module.exports.NATS_GROUP = 'sis-updater-nats.scheduler'
module.exports.SIS_UPDATER_SCHEDULE_CHANNEL = 'SIS_UPDATER_SCHEDULE_CHANNEL'
module.exports.SIS_MISC_SCHEDULE_CHANNEL = 'SIS_MISC_SCHEDULE_CHANNEL'
module.exports.SIS_PURGE_CHANNEL = 'SIS_PURGE_CHANNEL'
module.exports.CHUNK_SIZE = 100
module.exports.isDev = process.env.NODE_ENV === 'development'
module.exports.isStaging = process.env.STAGING || false
module.exports.isProduction = process.env.NODE_ENV === 'production'
module.exports.SECRET_TOKEN = process.env.SECRET_TOKEN
module.exports.REDIS_TOTAL_META_KEY = 'TOTAL_META'
module.exports.REDIS_TOTAL_STUDENTS_KEY = 'TOTAL_STUDENTS'
module.exports.DEV_SCHEDULE_COUNT = 1000
module.exports.REDIS_LAST_HOURLY_SCHEDULE = 'LAST_HOURLY_SCHEDULE'
module.exports.REDIS_LATEST_MESSAGE_RECEIVED = 'LATEST_MESSAGE_RECEIVED'
module.exports.LATEST_MESSAGE_RECEIVED_THRESHOLD = 1000 * 60 * 5
module.exports.REDIS_LAST_WEEKLY_SCHEDULE = 'LAST_WEEKLY_SCHEDULE'
module.exports.REDIS_LAST_PREPURGE_INFO = 'LAST_PREPURGE_INFO'
module.exports.REDIS_HOST = process.env.REDIS_HOST

module.exports.EXIT_AFTER_IMMEDIATES = process.env.EXIT_AFTER_IMMEDIATES === 'yes'
module.exports.SCHEDULE_IMMEDIATE = process.env.SCHEDULE_IMMEDIATE?.split(',') || []
module.exports.ENABLE_WORKER_REPORTING =
  module.exports.EXIT_AFTER_IMMEDIATES || process.env.ENABLE_WORKER_REPORTING === 'yes'
module.exports.SLACK_WEBHOOK = process.env.SLACK_WEBHOOK
module.exports.serviceProvider = process.env.SERVICE_PROVIDER ? process.env.SERVICE_PROVIDER.toLowerCase() : ''
module.exports.runningInCI = process.env.CI === 'true'
