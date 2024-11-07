import * as Sentry from '@sentry/node'
import { nodeProfilingIntegration } from '@sentry/profiling-node'

import { runningInCI, isStaging } from '../config'

if (!runningInCI && !isStaging && process.env.SENTRY_DSN != null) {
  Sentry.init({
    integrations: [nodeProfilingIntegration()],
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
  })
}
