// Node env to use
const isDev = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'
const isStaging = !isProduction && process.env.REACT_APP_STAGING === 'true'

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
const jamiUrl = isDev || runningInCI ? 'http://jami:3003/' : 'https://importer.cs.helsinki.fi/api/auth'

// Importer client
const importerToken = process.env.IMPORTER_DB_API_TOKEN || ''

// Networking: Urls & ports
const baseUrl = isDev ? '/api' : ''
const frontUrl = process.env.FRONT_URL
const backendPort = 8080

// Analytics
const ANALYTICS_INFLUXDB_URL = process.env.ANALYTICS_INFLUXDB_URL
const ANALYTICS_INFLUXDB_USER = process.env.ANALYTICS_INFLUXDB_USER
const ANALYTICS_INFLUXDB_PASSWORD = process.env.ANALYTICS_INFLUXDB_PASSWORD
const ANALYTICS_INFLUXDB_DB = process.env.ANALYTICS_INFLUXDB_DB

// Matomo
const MATOMO_SITE_ID = process.env.MATOMO_SITE_ID
const MATOMO_URL = process.env.MATOMO_URL

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

const formatURL = url => {
  return !!url && !url.startsWith('http') ? `http://${url}` : url
}

const addSlashToEnd = url => (url.endsWith('/') ? url : url + '/')

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
  ANALYTICS_INFLUXDB_URL: formatURL(ANALYTICS_INFLUXDB_URL),
  ANALYTICS_INFLUXDB_USER,
  ANALYTICS_INFLUXDB_PASSWORD,
  ANALYTICS_INFLUXDB_DB,
  MATOMO_SITE_ID,
  MATOMO_URL: MATOMO_URL && addSlashToEnd(MATOMO_URL),
  runningInCI,
  sentryRelease,
  sentryEnvironment,
  isProduction,
  pateToken,
  jamiUrl,
  baseUrl,
  frontUrl,
  backendPort,
  importerToken,
}
