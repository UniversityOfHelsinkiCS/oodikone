// Node env to use
const isProduction = process.env.NODE_ENV === 'production'
const isDev = process.env.NODE_ENV === 'development'

// Sentry
const SENTRY_RELEASE = process.env.REACT_APP_SENTRY_RELEASE || ''
const SENTRY_ENVIRONMENT = process.env.REACT_APP_SENTRY_ENVIRONMENT || ''

// Adminer is only used in dev mode, imo hardcoding this url here is ok.
const adminerBaseUrl = 'http://localhost:5050'
const databaseNames = ['kone-db', 'oodi-db', 'sis-db', 'sis-importer-db', 'user-db']
const adminerUrls = databaseNames.map(db => ({ url: `${adminerBaseUrl}/?pgsql=${db}&username=postgres`, text: db }))

// Base paths
const basePath = process.env.REACT_APP_PUBLIC_URL || ''
const apiBasePath = `${basePath}/api`

// Build at time
const builtAt = process.env.REACT_APP_BUILT_AT || ''

console.log('builtAt in conf: ', builtAt)

console.log('whole process env', JSON.stringify(process.env, null, 2))

module.exports = {
  adminerUrls,
  isProduction,
  isDev,
  basePath,
  apiBasePath,
  builtAt,
  SENTRY_RELEASE,
  SENTRY_ENVIRONMENT,
}
