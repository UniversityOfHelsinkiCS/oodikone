import React, { Component, Suspense } from 'react'
import { connect } from 'react-redux'
import { node, shape, string, bool, func } from 'prop-types'
import { Loader } from 'semantic-ui-react'
import * as Sentry from '@sentry/browser'
import { login as loginAction } from '../../redux/auth'

import { getUserName, userIsEnabled } from '../../common'

const AccessDenied = React.lazy(() => import('../AccessDenied'))

class ErrorBoundary extends Component {
  state = {
    hasError: false,
    enabled: false,
    loaded: false
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidMount() {
    this.props.login()
  }

  componentDidUpdate() {
    if (!this.state.loaded) {
      this.init()
    }
  }

  componentDidCatch = (e) => {
    Sentry.captureException(e)
  }

  init = () => {
    const { auth: { token, error } } = this.props
    if (token || error) {
      const enabled = userIsEnabled()
      const name = getUserName()
      Sentry.configureScope(scope => scope.setUser({ username: name }))
      this.setState({ enabled, loaded: true })
    }
  }

  render() {
    if (!this.state.loaded) {
      return <Loader active inline="centered" />
    }

    if (!this.state.hasError && this.state.enabled) {
      return this.props.children
    }

    return (
      <Suspense fallback={<Loader active inline="centered" />}>
        <AccessDenied notEnabled={!this.state.enabled} />
      </Suspense>
    )
  }
}

ErrorBoundary.propTypes = {
  auth: shape({
    token: string,
    error: bool
  }),
  login: func.isRequired,
  children: node.isRequired
}

ErrorBoundary.defaultProps = {
  auth: {
    token: null,
    error: false
  }
}

const mapStateToProps = ({ actionHistory, auth }) => {
  Sentry.configureScope(async (scope) => {
    scope.setExtra('actionHistory', JSON.stringify(actionHistory))
  })
  return {
    auth
  }
}

export default connect(mapStateToProps, { login: loginAction })(ErrorBoundary)
