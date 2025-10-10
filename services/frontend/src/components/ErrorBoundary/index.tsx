import * as Sentry from '@sentry/browser'
import { type ReactNode, Component } from 'react'

import { ErrorBackground } from '@/components/material/ErrorBackground'
import { actionHistory } from '@/redux/actionHistory'

let lastErrorSent = null

// This is here so that also errors from event handlers and such are sent
window.addEventListener('error', ({ error }) => {
  if (lastErrorSent !== error) {
    lastErrorSent = error
    Sentry.captureException(error)
  }
})

class CustomErrorBoundary extends Component<{
  children: ReactNode
  actionHistory?: Array<Record<string, any>>
}> {
  public state: { hasError: boolean }

  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(_) {
    return { hasError: true }
  }

  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  componentDidCatch(error, errorInfo) {
    if (lastErrorSent === error) return

    const cleanedActionHistory = actionHistory.map(({ payload, ...rest }) => rest)

    lastErrorSent = error
    const encoder = new TextEncoder()

    // NOTE: Sentry's maximum for an individual extra data item is 16kB so let's make sure we don't exceed that
    while (encoder.encode(JSON.stringify(cleanedActionHistory)).length > 16000) cleanedActionHistory.shift()

    Sentry.withScope(scope => {
      scope.setExtras({
        ...errorInfo,
        actionHistory: JSON.stringify(cleanedActionHistory),
      })
      Sentry.captureException(error)
    })
  }

  render() {
    if (this.state.hasError) {
      const content =
        'If this was not intended try refreshing your browser window, logging out or contacting grp-toska@helsinki.fi'
      return <ErrorBackground content={content} header={'Something broke'} />
    }

    return this.props.children
  }
}

export const ErrorBoundary = ({ children }) => <CustomErrorBoundary>{children}</CustomErrorBoundary>
