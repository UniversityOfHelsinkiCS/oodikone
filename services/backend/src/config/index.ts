// Node env to use
export const isDev = process.env.NODE_ENV === 'development'
export const isTest = process.env.NODE_ENV === 'test'
export const isStaging = process.env.REACT_APP_STAGING === 'true'
export const isProduction = !isStaging && process.env.NODE_ENV === 'production'

export const runningInCI = process.env.CI === 'true'

// IAM group
export const requiredGroup = isStaging
  ? ['grp-oodikone-staging-users', 'grp-oodikone-basic-staging-users']
  : ['grp-oodikone-users', 'grp-oodikone-basic-users']

// Pate
export const pateToken = process.env.PATE_API_TOKEN ?? ''

// Jami
export const jamiUrl = process.env.JAMI_URL ?? ''

// Importer client
export const importerUrl = process.env.IMPORTER_DB_API_URL ?? ''
export const importerToken = process.env.IMPORTER_DB_API_TOKEN ?? ''
export const importerDbApiUser = process.env.IMPORTER_DB_API_USER ?? ''
export const importerDbApiPassword = process.env.IMPORTER_DB_API_PASSWORD ?? ''

// Sisu
export const sisUrl = process.env.SIS_HOST
export const sisGrapqlAppAccount = process.env.SIS_GRAPHQL_APPLICATION_ACCOUNT
export const sisGrapqlAppKey = process.env.SIS_GRAPHQL_APPLICATION_KEY

// Networking: Urls & ports
export const baseUrl = isDev ? '/api' : ''
export const frontUrl = process.env.FRONT_URL
export const backendPort = 8080

// Other stuff
export const { DB_URL_KONE, DB_URL_USER, SECRET_TOKEN, SIS_DB_URL, SIS_UPDATER_URL, CRYPT_KEY } = process.env

export const rootOrgId = process.env.ROOT_ORG_ID ?? 'hy-university-root-id'

export const languageCenterViewEnabled =
  process.env.LANGUAGE_CENTER_VIEW_ENABLED == null ? true : process.env.LANGUAGE_CENTER_VIEW_ENABLED === 'true'

export const concurrentWorkers = parseInt(process.env.CONCURRENT_WORKERS!, 10) || 2

export const DB_MAX_CONNECTIONS = parseInt(process.env.DB_MAX_CONNECTIONS!, 10) || 5 // sequelize's default
export const DB_MAX_CRON_CONNECTIONS = Math.max(1, DB_MAX_CONNECTIONS - 5)
export const CRON_SCHEDULE = process.env.CRON_SCHEDULE ?? '0 23 * * *' // Default to 23:00 daily

export const redis = process.env.REDIS
export const DB_SCHEMA_KONE = process.env.DB_SCHEMA_KONE ?? 'public'

export const KONE_PASSWORD = process.env.KONE_PASSWORD ?? 'postgres'
export const USER_PASSWORD = process.env.USER_PASSWORD ?? 'postgres'
export const SIS_PASSWORD = process.env.SIS_PASSWORD ?? 'postgres'
