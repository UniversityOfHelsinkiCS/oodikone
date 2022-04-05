const Sentry = require('@sentry/node')

const { sentryRelease, sentryEnvironment, runningInCI } = require('../config')

const initializeSentry = () => {
  if (!sentryRelease || !sentryEnvironment || runningInCI) return

  Sentry.init({
    dsn: 'https://5fe012d12b7448d3b937f20ea941a8e5@sentry.cs.helsinki.fi/10',
    environment: sentryEnvironment,
    release: sentryRelease,
    tracesSampleRate: 1.0,
  })
}

module.exports = initializeSentry
