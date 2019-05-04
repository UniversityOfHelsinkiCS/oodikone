import React, { Component, Suspense } from 'react'
import { connect } from 'react-redux'
import { node } from 'prop-types'
import { Loader } from 'semantic-ui-react'
import * as Sentry from '@sentry/browser'

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

  async componentDidMount() {
    const enabled = await userIsEnabled()
    const name = await getUserName()
    Sentry.configureScope(scope => scope.setUser({ username: name }))
    this.setState({ enabled, loaded: true })
  }

  componentDidCatch = (e) => {
    Sentry.captureException(e)
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
  children: node.isRequired
}

const mapStateToProps = ({ actionHistory }) => {
  Sentry.configureScope(async (scope) => {
    scope.setExtra('actionHistory', JSON.stringify(actionHistory))
  })
  return {}
}

export default connect(mapStateToProps)(ErrorBoundary)
