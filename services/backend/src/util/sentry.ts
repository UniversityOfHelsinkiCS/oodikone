import Sentry from '@sentry/node'
import Tracing from '@sentry/tracing'

import { isStaging, runningInCI, sentryDSN, sentryEnvironment, sentryRelease } from '../conf-backend'

export const initializeSentry = (app): void => {
  if (!sentryRelease || !sentryEnvironment || runningInCI || isStaging || !sentryDSN) {
    return
  }

  Sentry.init({
    dsn: sentryDSN,
    environment: sentryEnvironment,
    release: sentryRelease,
    integrations: [new Sentry.Integrations.Http({ tracing: true }), new Tracing.Integrations.Express({ app })],
    tracesSampleRate: 1.0,
  })
}
