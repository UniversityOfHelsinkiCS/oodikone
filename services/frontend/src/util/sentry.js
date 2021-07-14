import * as Sentry from '@sentry/browser'
import { SENTRY_RELEASE, SENTRY_ENVIRONMENT } from '../conf'

const initializeSentry = () => {

  console.log("Sentry release", SENTRY_RELEASE)
  if (!SENTRY_RELEASE || !SENTRY_ENVIRONMENT) return

  console.log("Initializing sentry!")

  Sentry.init({
    dsn: 'https://020b79f0cbb14aad94cc9d69a1ea9d52@sentry.cs.helsinki.fi/2',
    environment: SENTRY_ENVIRONMENT,
    release: SENTRY_RELEASE,
  })
}

export default initializeSentry
