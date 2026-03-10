import * as Sentry from '@sentry/browser'

import { runningInCypress, sentryEnvironment, sentryRelease, sentryDSN } from '@/conf'

export const initializeSentry = () => {
  if (!sentryRelease || !sentryEnvironment || !sentryDSN || runningInCypress) return

  Sentry.init({
    dsn: sentryDSN,
    environment: sentryEnvironment,
    release: sentryRelease,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 1.0,
  })
}
