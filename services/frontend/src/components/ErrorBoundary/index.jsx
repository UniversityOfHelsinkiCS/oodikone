import React, { Component, Suspense } from 'react'
import { connect } from 'react-redux'
import { Loader } from 'semantic-ui-react'
import * as Sentry from '@sentry/browser'
import TSA from '../../common/tsa'
import { login as loginAction } from '../../redux/auth'
import AccessDenied from '../AccessDenied'

class ErrorBoundary extends Component {
  state = {
    hasError: false,
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidMount() {
    this.props.login()
  }

  componentDidUpdate = prevProps => {
    if (prevProps.auth.token === this.props.auth.token || !this.props.auth.token) {
      return
    }

    const { userId, mockedBy } = this.props.auth.token

    Sentry.configureScope(scope => {
      scope.setUser({
        username: userId,
        mockedBy,
      })
    })
    TSA.Matomo.setUserId(mockedBy || userId)

    if (mockedBy) {
      TSA.Matomo.sendEvent('Admin', 'Mocking user', userId)
    }
  }

  componentDidCatch = e => {
    const { actionHistory } = this.props
    Sentry.withScope(s => {
      s.setExtra('actionHistory', JSON.stringify(actionHistory))
      Sentry.captureException(e)
    })
  }

  render() {
    const { token, error, pending } = this.props.auth

    if (!error && !this.state.hasError) {
      if (!token || pending) {
        return <Loader active inline="centered" />
      }
      if (token.enabled) return this.props.children
    }

    return (
      <Suspense fallback={<Loader active inline="centered" />}>
        <AccessDenied notEnabled={!token || !token.enabled} />
      </Suspense>
    )
  }
}

ErrorBoundary.defaultProps = {
  actionHistory: null,
}

const mapStateToProps = ({ actionHistory, auth }) => ({
  auth,
  actionHistory,
})

export default connect(mapStateToProps, { login: loginAction })(ErrorBoundary)
