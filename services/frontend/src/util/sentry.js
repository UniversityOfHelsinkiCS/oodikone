import * as Sentry from '@sentry/browser'
import { Integrations } from '@sentry/tracing'
import { sentryRelease, sentryEnvironment, runningInCypress } from '../conf'

export const initializeSentry = () => {
  if (!sentryRelease || !sentryEnvironment || runningInCypress) return

  Sentry.init({
    dsn: 'https://b6d3f10ac9a2c333461c74312bfb71d1@toska.cs.helsinki.fi/14',
    environment: sentryEnvironment,
    release: sentryRelease,
    integrations: [new Integrations.BrowserTracing()],
    tracesSampleRate: 1.0,
  })
}
