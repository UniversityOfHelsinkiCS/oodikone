module.exports.CHUNK_SIZE = process.env.CHUNK_SIZE || 100
module.exports.isDev = process.env.NODE_ENV === 'development'
module.exports.isStaging = process.env.STAGING || false
module.exports.isProduction = process.env.NODE_ENV === 'production'
module.exports.SECRET_TOKEN = process.env.SECRET_TOKEN
module.exports.DEV_SCHEDULE_COUNT = 1000
module.exports.REDIS_LAST_HOURLY_SCHEDULE = 'LAST_HOURLY_SCHEDULE'
module.exports.REDIS_LATEST_MESSAGE_RECEIVED = 'LATEST_MESSAGE_RECEIVED'
module.exports.LATEST_MESSAGE_RECEIVED_THRESHOLD = 1000 * 60 * 5
module.exports.REDIS_LAST_WEEKLY_SCHEDULE = 'LAST_WEEKLY_SCHEDULE'
module.exports.REDIS_LAST_PREPURGE_INFO = 'LAST_PREPURGE_INFO'
module.exports.REDIS_HOST = process.env.REDIS_HOST
module.exports.REDIS_PORT = process.env.REDIS_PORT || 6379

module.exports.SIS_IMPORTER_HOST = process.env.SIS_IMPORTER_HOST
module.exports.SIS_IMPORTER_PORT = process.env.SIS_IMPORTER_PORT
module.exports.SIS_IMPORTER_USER = process.env.SIS_IMPORTER_USER
module.exports.SIS_IMPORTER_PASSWORD = process.env.SIS_IMPORTER_PASSWORD
module.exports.SIS_IMPORTER_DATABASE = process.env.SIS_IMPORTER_DATABASE

module.exports.EXIT_AFTER_IMMEDIATES = process.env.EXIT_AFTER_IMMEDIATES === 'yes'
module.exports.SCHEDULE_IMMEDIATE = process.env.SCHEDULE_IMMEDIATE ? process.env.SCHEDULE_IMMEDIATE.split(',') : []
module.exports.SLACK_WEBHOOK = process.env.SLACK_WEBHOOK
module.exports.runningInCI = process.env.CI === 'true'
module.exports.SENTRY_DSN = process.env.SENTRY_DSN
