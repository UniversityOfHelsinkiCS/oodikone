module.exports.isDev = process.env.NODE_ENV === 'development'
module.exports.isStaging = process.env.STAGING || false
module.exports.isProduction = process.env.NODE_ENV === 'production'
module.exports.MIGRATIONS_LOCK = 'MIGRATIONS_LOCK'
module.exports.PURGE_LOCK = 'PURGE_LOCK'
module.exports.REDIS_HOST = process.env.REDIS_HOST || 'redis-updater'
module.exports.REDIS_PORT = process.env.REDIS_PORT || 6379
module.exports.rootOrgId = process.env.ROOT_ORG_ID || 'hy-university-root-id'
module.exports.serviceProvider = process.env.SERVICE_PROVIDER ? process.env.SERVICE_PROVIDER.toLowerCase() : ''
module.exports.runningInCI = process.env.CI === 'true'
module.exports.SENTRY_DSN = process.env.SENTRY_DSN

module.exports.DB_URL = process.env.DB_URL
module.exports.SIS_IMPORTER_HOST = process.env.SIS_IMPORTER_HOST
module.exports.SIS_IMPORTER_PORT = process.env.SIS_IMPORTER_PORT
module.exports.SIS_IMPORTER_USER = process.env.SIS_IMPORTER_USER
module.exports.SIS_IMPORTER_PASSWORD = process.env.SIS_IMPORTER_PASSWORD
module.exports.SIS_IMPORTER_DATABASE = process.env.SIS_IMPORTER_DATABASE
module.exports.SIS_PASSWORD = process.env.SIS_PASSWORD
