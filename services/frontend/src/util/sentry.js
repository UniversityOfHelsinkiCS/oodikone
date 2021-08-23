import * as Sentry from '@sentry/browser'
import { SENTRY_RELEASE, SENTRY_ENVIRONMENT, runningInCI } from '../conf'

const initializeSentry = () => {
  if (!SENTRY_RELEASE || !SENTRY_ENVIRONMENT || runningInCI) return

  Sentry.init({
    dsn: 'https://020b79f0cbb14aad94cc9d69a1ea9d52@sentry.cs.helsinki.fi/2',
    environment: SENTRY_ENVIRONMENT,
    release: SENTRY_RELEASE,
  })
}

export default initializeSentry
