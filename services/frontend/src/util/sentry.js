import * as Sentry from '@sentry/browser'
import { Integrations } from '@sentry/tracing'
import { sentryRelease, sentryEnvironment, runningInCypress } from '../conf'

const initializeSentry = () => {
  if (!sentryRelease || !sentryEnvironment || runningInCypress) return

  Sentry.init({
    dsn: 'https://020b79f0cbb14aad94cc9d69a1ea9d52@sentry.cs.helsinki.fi/2',
    environment: sentryEnvironment,
    release: sentryRelease,
    integrations: [new Integrations.BrowserTracing()],
    tracesSampleRate: 1.0,
  })
}

export default initializeSentry
