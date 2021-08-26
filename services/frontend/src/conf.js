// Node env to use
const isProduction = process.env.NODE_ENV === 'production'
const isDev = process.env.NODE_ENV === 'development'

// Sentry
const sentryRelease = process.env.REACT_APP_SENTRY_RELEASE || ''
const sentryEnvironment = process.env.REACT_APP_SENTRY_ENVIRONMENT || ''
const runningInCypress = !!window.Cypress

// Adminer is only used in dev mode, imo hardcoding this url here is ok.
const adminerBaseUrl = 'http://localhost:5050'
const databaseNames = ['kone-db', 'sis-db', 'sis-importer-db', 'user-db']
const adminerUrls = databaseNames.map(db => ({ url: `${adminerBaseUrl}/?pgsql=${db}&username=postgres`, text: db }))

// Base paths
const basePath = process.env.PUBLIC_URL || ''
const apiBasePath = `${basePath}/api`

// Update time for frontpage
const builtAt = process.env.REACT_APP_BUILT_AT || ''

module.exports = {
  adminerUrls,
  isProduction,
  isDev,
  basePath,
  apiBasePath,
  builtAt,
  runningInCypress,
  sentryRelease,
  sentryEnvironment,
}
