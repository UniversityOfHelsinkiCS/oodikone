const Sentry = require('@sentry/node')
const Tracing = require('@sentry/tracing')

const { sentryRelease, sentryEnvironment, runningInCI, isStaging } = require('../conf-backend')

const initializeSentry = app => {
  if (!sentryRelease || !sentryEnvironment || runningInCI || isStaging) return

  Sentry.init({
    dsn: 'https://020b79f0cbb14aad94cc9d69a1ea9d52@sentry.cs.helsinki.fi/2',
    environment: sentryEnvironment,
    release: sentryRelease,
    integrations: [new Sentry.Integrations.Http({ tracing: true }), new Tracing.Integrations.Express({ app })],
    tracesSampleRate: 1.0,
  })
}

module.exports = initializeSentry
