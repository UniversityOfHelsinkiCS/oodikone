import React, { Component, Suspense } from 'react'
import { connect } from 'react-redux'
import { Loader } from 'semantic-ui-react'
import * as Sentry from '@sentry/browser'

import { AccessDenied } from 'components/AccessDenied'

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
    Sentry.withScope(scope => {
      scope.setExtras({
        ...errorInfo,
        actionHistory: actionHistory ? JSON.stringify(actionHistory) : undefined,
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
