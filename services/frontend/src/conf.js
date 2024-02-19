const getEnvVar = (key, defaultValue = '') => (import.meta.env ? import.meta.env[key] || defaultValue : defaultValue)

// Node env to use
export const isProduction = process.env.NODE_ENV === 'production'
export const isDev = process.env.NODE_ENV === 'development'
export const inStaging = getEnvVar('VITE_APP_STAGING', 'false') === 'true'

// Sentry
export const sentryRelease = getEnvVar('VITE_APP_SENTRY_RELEASE')
export const sentryEnvironment = getEnvVar('VITE_APP_SENTRY_ENVIRONMENT')
export const runningInCypress = typeof window !== 'undefined' && !!window.Cypress

// Adminer is only used in dev mode, imo hardcoding this url here is ok.
const adminerBaseUrl = 'http://localhost:5050'
const databaseNames = ['kone-db', 'sis-db', 'sis-importer-db', 'user-db']
export const adminerUrls = databaseNames.map(db => ({
  url: `${adminerBaseUrl}/?pgsql=${db}&username=postgres`,
  text: db,
}))

// Base paths
export const basePath = getEnvVar('BASE_URL', '/')
export const apiBasePath = `${basePath}api`

// Update time for frontpage
export const builtAt = getEnvVar('VITE_APP_BUILT_AT')
