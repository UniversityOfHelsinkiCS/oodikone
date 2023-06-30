// Node env to use
const isDev = process.env.NODE_ENV === 'development'
const isStaging = process.env.REACT_APP_STAGING === 'true'
const isProduction = !isStaging && process.env.NODE_ENV === 'production'

// Sentry
const sentryRelease = process.env.SENTRY_RELEASE || ''
const sentryEnvironment = process.env.SENTRY_ENVIRONMENT || ''
const runningInCI = process.env.CI === 'true'

// IAM group
const requiredGroup = isStaging
  ? ['grp-oodikone-staging-users', 'grp-oodikone-basic-staging-users']
  : ['grp-oodikone-users', 'grp-oodikone-basic-users']

// Pate
const pateToken = process.env.PATE_API_TOKEN || ''

// Jami
const jamiUrl = process.env.JAMI_URL || ''

// Importer client
const importerUrl = process.env.IMPORTER_DB_API_URL || ''
const importerToken = process.env.IMPORTER_DB_API_TOKEN || ''

// Networking: Urls & ports
const baseUrl = isDev ? '/api' : ''
const frontUrl = process.env.FRONT_URL
const backendPort = 8080

// Other stuff
const DB_URL_KONE = process.env.DB_URL_KONE
const DB_URL_USER = process.env.DB_URL_USER

let DB_MAX_CONNECTIONS = parseInt(process.env.DB_MAX_CONNECTIONS, 10)
if (isNaN(DB_MAX_CONNECTIONS)) {
  DB_MAX_CONNECTIONS = 5 // sequelize's default
}
let DB_MAX_CRON_CONNECTIONS = DB_MAX_CONNECTIONS - 5
if (DB_MAX_CRON_CONNECTIONS < 1) {
  DB_MAX_CRON_CONNECTIONS = 1
}

const redis = process.env.REDIS
const SECRET_TOKEN = process.env.SECRET_TOKEN
const DB_SCHEMA_KONE = process.env.DB_SCHEMA_KONE || 'public'
const SIS_UPDATER_URL = process.env.SIS_UPDATER_URL

module.exports = {
  DB_URL_USER,
  DB_URL_KONE,
  DB_MAX_CONNECTIONS,
  DB_MAX_CRON_CONNECTIONS,
  redis,
  SECRET_TOKEN,
  DB_SCHEMA_KONE,
  requiredGroup,
  SIS_UPDATER_URL,
  runningInCI,
  sentryRelease,
  sentryEnvironment,
  isProduction,
  pateToken,
  jamiUrl,
  baseUrl,
  frontUrl,
  backendPort,
  importerUrl,
  importerToken,
}
