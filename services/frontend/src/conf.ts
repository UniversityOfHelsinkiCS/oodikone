// Node env to use
export const isProduction = process.env.NODE_ENV === 'production'
export const isDev = process.env.NODE_ENV === 'development'
export const inStaging = process.env.REACT_APP_STAGING === 'true'

// Sentry
export const sentryRelease = process.env.REACT_APP_SENTRY_RELEASE ?? ''
export const sentryEnvironment = process.env.REACT_APP_SENTRY_ENVIRONMENT ?? ''
export const sentryDSN = process.env.REACT_APP_SENTRY_DSN ?? ''

interface CypressWindow extends Window {
  Cypress?: any
}
export const runningInCypress = typeof window !== 'undefined' && !!(window as CypressWindow).Cypress

// Base paths
export const basePath = process.env.PUBLIC_URL ?? ''
export const apiBasePath = `${basePath}/api`

// Footer information
export const builtAt = process.env.REACT_APP_BUILT_AT ?? ''
export const sourceCodeUrl = 'https://github.com/UniversityOfHelsinkiCS/oodikone'
export const licenseUrl = `${sourceCodeUrl}/blob/master/LICENSE`
export const dataProtectionUrl = `${sourceCodeUrl}/blob/master/documentation/tietosuoja.md`

// Service provider depending this hiding some not needed features default value toska
// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
export const serviceProvider = process.env.REACT_APP_SERVICE_PROVIDER?.toLowerCase() || 'toska'

// Variable that can be used to disable the language center view, by default the view is enabled
export const languageCenterViewEnabled = !process.env.REACT_APP_LANGUAGE_CENTER_VIEW_ENABLED
  ? true
  : process.env.REACT_APP_LANGUAGE_CENTER_VIEW_ENABLED === 'true'

// SISU url
export const sisUrl = process.env.REACT_APP_SIS_URL ?? 'https://sisu.helsinki.fi'
