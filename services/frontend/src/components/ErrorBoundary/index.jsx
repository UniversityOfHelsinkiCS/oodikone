import * as Sentry from '@sentry/browser'
import React, { Component, Suspense } from 'react'
import { connect } from 'react-redux'
import { Loader } from 'semantic-ui-react'

import { AccessDenied } from 'components/AccessDenied'

let sent = null

// This is here so that also errors from event handlers and such are sent
window.addEventListener('error', event => {
  if (sent === event.error) return
  sent = event.error
  Sentry.captureException(event.error)
})

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
    }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    const { actionHistory } = this.props
    const cleanedActionHistory = actionHistory ? actionHistory.map(({ payload, ...rest }) => rest) : []
    const encoder = new TextEncoder()
    if (sent === error) return
    sent = error
    // Sentry's maximum for an individual extra data item is 16kB so let's make sure we don't exceed that
    while (encoder.encode(JSON.stringify(cleanedActionHistory)).length > 16000) {
      cleanedActionHistory.shift()
    }
    Sentry.withScope(scope => {
      scope.setExtras({
        ...errorInfo,
        actionHistory: JSON.stringify(cleanedActionHistory),
      })
      Sentry.captureException(error)
    })
  }

  render() {
    const { hasError } = this.state
    const { children } = this.props
    if (!hasError) return children

    return (
      <Suspense fallback={<Loader active inline="centered" />}>
        <AccessDenied notEnabled={false} />
      </Suspense>
    )
  }
}
const mapStateToProps = ({ actionHistory }) => ({ actionHistory })

export const ConnectedErrorBoundary = connect(mapStateToProps, null)(ErrorBoundary)
