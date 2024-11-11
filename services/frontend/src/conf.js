// Node env to use
export const isProduction = process.env.NODE_ENV === 'production'
export const isDev = process.env.NODE_ENV === 'development'
export const inStaging = process.env.REACT_APP_STAGING === 'true'

// Sentry
export const sentryRelease = process.env.REACT_APP_SENTRY_RELEASE || ''
export const sentryEnvironment = process.env.REACT_APP_SENTRY_ENVIRONMENT || ''
export const sentryDSN = process.env.REACT_APP_SENTRY_DSN || ''
export const runningInCypress = typeof window !== 'undefined' && !!window.Cypress

// Base paths
export const basePath = process.env.PUBLIC_URL || ''
export const apiBasePath = `${basePath}/api`

// Update time for frontpage
export const builtAt = process.env.REACT_APP_BUILT_AT || ''

// Service provider depending this hiding some not needed features default value toska
export const serviceProvider = process.env.REACT_APP_SERVICE_PROVIDER
  ? process.env.REACT_APP_SERVICE_PROVIDER.toLowerCase()
  : 'toska'

// Variable that can be used to disable the language center view, by default the view is enabled
export const languageCenterViewEnabled = !process.env.REACT_APP_LANGUAGE_CENTER_VIEW_ENABLED
  ? true
  : process.env.REACT_APP_LANGUAGE_CENTER_VIEW_ENABLED === 'true'
