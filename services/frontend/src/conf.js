// Node env to use
export const isProduction = process.env.NODE_ENV === 'production'
export const isDev = process.env.NODE_ENV === 'development'

// Sentry
export const sentryRelease = import.meta.env.REACT_APP_SENTRY_RELEASE || ''
export const sentryEnvironment = import.meta.env.REACT_APP_SENTRY_ENVIRONMENT || ''
export const runningInCypress = !!window.Cypress

// Adminer is only used in dev mode, imo hardcoding this url here is ok.
const adminerBaseUrl = 'http://localhost:5050'
const databaseNames = ['kone-db', 'sis-db', 'sis-importer-db', 'user-db']
export const adminerUrls = databaseNames.map(db => ({
  url: `${adminerBaseUrl}/?pgsql=${db}&username=postgres`,
  text: db,
}))

// Base paths
export const basePath = import.meta.env.PUBLIC_URL || ''
export const apiBasePath = `${basePath}/api`

// Update time for frontpage
export const builtAt = import.meta.env.REACT_APP_BUILT_AT || ''
