const Sentry = require('@sentry/node')
const Tracing = require('@sentry/tracing')

const { sentryRelease, sentryEnvironment, runningInCI, isStaging } = require('../conf-backend')

const initializeSentry = app => {
  if (!sentryRelease || !sentryEnvironment || runningInCI || isStaging) return

  Sentry.init({
    dsn: 'https://b6d3f10ac9a2c333461c74312bfb71d1@toska.cs.helsinki.fi/14',
    environment: sentryEnvironment,
    release: sentryRelease,
    integrations: [new Sentry.Integrations.Http({ tracing: true }), new Tracing.Integrations.Express({ app })],
    tracesSampleRate: 1.0,
  })
}

module.exports = initializeSentry
