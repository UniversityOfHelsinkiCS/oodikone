// Node env to use
const isDev = process.env.NODE_ENV === 'development'
const isStaging = process.env.REACT_APP_STAGING === 'true'
const isProduction = !isStaging && process.env.NODE_ENV === 'production'

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
const importerDbApiUser = process.env.IMPORTER_DB_API_USER || ''
const importerDbApiPassword = process.env.IMPORTER_DB_API_PASSWORD || ''

// Sisu
const sisUrl = process.env.SIS_HOST
const sisGrapqlAppAccount = process.env.SIS_GRAPHQL_APPLICATION_ACCOUNT
const sisGrapqlAppKey = process.env.SIS_GRAPHQL_APPLICATION_KEY

// Networking: Urls & ports
const baseUrl = isDev ? '/api' : ''
const frontUrl = process.env.FRONT_URL
const backendPort = 8080

// System run in whose environment
const serviceProvider = process.env.SERVICE_PROVIDER ? process.env.SERVICE_PROVIDER.toLowerCase() : 'toska'

// Optional logout-url configuration
const configLogoutUrl = serviceProvider === 'toska' ? undefined : process.env.LOGOUT_URL

// Other stuff
const { DB_URL_KONE, DB_URL_USER, SECRET_TOKEN, SIS_DB_URL, SIS_UPDATER_URL, CRYPT_KEY } = process.env

const rootOrgId = process.env.ROOT_ORG_ID || 'hy-university-root-id'

const languageCenterViewEnabled =
  process.env.LANGUAGE_CENTER_VIEW_ENABLED == null ? true : process.env.LANGUAGE_CENTER_VIEW_ENABLED === 'true'

const concurrentWorkers = process.env.CONCURRENT_WORKERS ? parseInt(process.env.CONCURRENT_WORKERS, 10) : 2

let DB_MAX_CONNECTIONS = parseInt(process.env.DB_MAX_CONNECTIONS, 10)
if (Number.isNaN(DB_MAX_CONNECTIONS)) {
  DB_MAX_CONNECTIONS = 5 // sequelize's default
}
let DB_MAX_CRON_CONNECTIONS = DB_MAX_CONNECTIONS - 5
if (DB_MAX_CRON_CONNECTIONS < 1) {
  DB_MAX_CRON_CONNECTIONS = 1
}
const CRON_SCHEDULE = process.env.CRON_SCHEDULE || '0 23 * * *' // Default to 23:00 daily

const redis = process.env.REDIS
const DB_SCHEMA_KONE = process.env.DB_SCHEMA_KONE || 'public'

const KONE_PASSWORD = process.env.KONE_PASSWORD || 'postgres'
const USER_PASSWORD = process.env.USER_PASSWORD || 'postgres'
const SIS_PASSWORD = process.env.SIS_PASSWORD || 'postgres'

module.exports = {
  DB_URL_USER,
  CRYPT_KEY,
  DB_URL_KONE,
  DB_MAX_CONNECTIONS,
  DB_MAX_CRON_CONNECTIONS,
  CRON_SCHEDULE,
  redis,
  SECRET_TOKEN,
  DB_SCHEMA_KONE,
  KONE_PASSWORD,
  USER_PASSWORD,
  SIS_PASSWORD,
  requiredGroup,
  SIS_DB_URL,
  SIS_UPDATER_URL,
  runningInCI,
  isProduction,
  pateToken,
  jamiUrl,
  baseUrl,
  frontUrl,
  backendPort,
  importerUrl,
  importerToken,
  importerDbApiUser,
  importerDbApiPassword,
  isDev,
  isStaging,
  rootOrgId,
  serviceProvider,
  configLogoutUrl,
  sisUrl,
  sisGrapqlAppAccount,
  sisGrapqlAppKey,
  languageCenterViewEnabled,
  concurrentWorkers,
}
