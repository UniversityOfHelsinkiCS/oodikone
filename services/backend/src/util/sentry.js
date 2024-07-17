const Sentry = require('@sentry/node')
const Tracing = require('@sentry/tracing')

const { sentryRelease, sentryEnvironment, runningInCI, isStaging, sentryDSN } = require('../config')

const initializeSentry = app => {
  if (!sentryRelease || !sentryEnvironment || runningInCI || isStaging || !sentryDSN) return

  Sentry.init({
    dsn: sentryDSN,
    environment: sentryEnvironment,
    release: sentryRelease,
    integrations: [new Sentry.Integrations.Http({ tracing: true }), new Tracing.Integrations.Express({ app })],
    tracesSampleRate: 1.0,
  })
}

module.exports = initializeSentry
