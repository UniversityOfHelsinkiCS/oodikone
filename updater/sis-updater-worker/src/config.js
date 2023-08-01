module.exports.isDev = process.env.NODE_ENV === 'development'
module.exports.isStaging = process.env.STAGING || false
module.exports.isProduction = process.env.NODE_ENV === 'production'
module.exports.NATS_GROUP = 'sis-updater-nats.workers'
module.exports.SIS_UPDATER_SCHEDULE_CHANNEL = 'SIS_UPDATER_SCHEDULE_CHANNEL'
module.exports.SIS_MISC_SCHEDULE_CHANNEL = 'SIS_MISC_SCHEDULE_CHANNEL'
module.exports.SIS_PURGE_CHANNEL = 'SIS_PURGE_CHANNEL'
module.exports.MIGRATIONS_LOCK = 'MIGRATIONS_LOCK'
module.exports.PURGE_LOCK = 'PURGE_LOCK'
module.exports.REDIS_TOTAL_META_KEY = 'TOTAL_META'
module.exports.REDIS_TOTAL_STUDENTS_KEY = 'TOTAL_STUDENTS'
module.exports.REDIS_TOTAL_META_DONE_KEY = 'TOTAL_META_DONE'
module.exports.REDIS_TOTAL_STUDENTS_DONE_KEY = 'TOTAL_STUDENTS_DONE'
module.exports.REDIS_LATEST_MESSAGE_RECEIVED = 'LATEST_MESSAGE_RECEIVED'

// Sentry
module.exports.sentryRelease = process.env.SENTRY_RELEASE || ''
module.exports.sentryEnvironment = process.env.SENTRY_ENVIRONMENT || ''
module.exports.runningInCI = process.env.CI === 'true'
