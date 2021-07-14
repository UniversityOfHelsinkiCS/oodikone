const isProduction = process.env.NODE_ENV === 'production'
const isDev = process.env.NODE_ENV === 'development'

const SENTRY_RELEASE = process.env.REACT_APP_SENTRY_RELEASE || ''
const SENTRY_ENVIRONMENT = process.env.REACT_APP_SENTRY_ENVIRONMENT || ''

module.exports = {
  isProduction,
  isDev,
  SENTRY_RELEASE,
  SENTRY_ENVIRONMENT
}
