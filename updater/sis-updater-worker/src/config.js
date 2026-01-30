export const isDev = process.env.NODE_ENV === 'development'
export const isStaging = process.env.STAGING || false
export const isProduction = process.env.NODE_ENV === 'production'
export const MIGRATIONS_LOCK = 'MIGRATIONS_LOCK'
export const PURGE_LOCK = 'PURGE_LOCK'
export const REDIS_HOST = process.env.REDIS_HOST || 'redis-updater'
export const REDIS_PORT = process.env.REDIS_PORT || 6379
export const rootOrgId = process.env.ROOT_ORG_ID || 'hy-university-root-id'
export const runningInCI = process.env.CI === 'true'
export const { SENTRY_DSN } = process.env

export const { DB_URL } = process.env
export const { SIS_IMPORTER_HOST } = process.env
export const { SIS_IMPORTER_PORT } = process.env
export const { SIS_IMPORTER_USER } = process.env
export const { SIS_IMPORTER_PASSWORD } = process.env
export const { SIS_IMPORTER_DATABASE } = process.env
export const { SIS_PASSWORD } = process.env
