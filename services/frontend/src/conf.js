// Node env to use
export const isProduction = process.env.NODE_ENV === 'production'
export const isDev = process.env.NODE_ENV === 'development'
export const inStaging = process.env.REACT_APP_STAGING === 'true'

// Sentry
export const sentryRelease = process.env.REACT_APP_SENTRY_RELEASE || ''
export const sentryEnvironment = process.env.REACT_APP_SENTRY_ENVIRONMENT || ''
export const sentryDSN = process.env.SENTRY_DSN || ''
export const runningInCypress = typeof window !== 'undefined' && !!window.Cypress

// Adminer is only used in dev mode, imo hardcoding this url here is ok.
const adminerBaseUrl = 'http://localhost:5050'
const databaseNames = ['kone-db', 'sis-db', 'sis-importer-db', 'user-db']
export const adminerUrls = databaseNames.map(db => ({
  url: `${adminerBaseUrl}/?pgsql=${db}&username=postgres`,
  text: db,
}))

// Base paths
export const basePath = process.env.PUBLIC_URL || ''
export const apiBasePath = `${basePath}/api`

// Update time for frontpage
export const builtAt = process.env.REACT_APP_BUILT_AT || ''

// Service provider depending this hiding some not needed features default value Toska
export const serviceProvider = process.env.SERVICE_PROVIDER || 'Toska'
