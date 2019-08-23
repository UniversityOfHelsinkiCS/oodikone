import React, { Component, Suspense } from 'react'
import { connect } from 'react-redux'
import { node, shape, bool, func, arrayOf } from 'prop-types'
import { Loader } from 'semantic-ui-react'
import * as Sentry from '@sentry/browser'
import { login as loginAction } from '../../redux/auth'

const AccessDenied = React.lazy(() => import('../AccessDenied'))

class ErrorBoundary extends Component {
  state = {
    hasError: false
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidMount() {
    this.props.login()
  }

  static getDerivedStateFromProps(props) {
    const { auth, actionHistory } = props
    Sentry.configureScope((scope) => {
      if (auth.token) scope.setUser({ username: auth.token.userId })
      scope.setExtra('actionHistory', JSON.stringify(actionHistory))
    })
    return null
  }

  componentDidCatch = (e) => {
    Sentry.captureException(e)
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

ErrorBoundary.propTypes = {
  auth: shape({
    token: shape({
      enabled: bool,
      pending: bool
    }),
    error: bool
  }).isRequired,
  actionHistory: arrayOf(shape({})),
  login: func.isRequired,
  children: node.isRequired
}

ErrorBoundary.defaultProps = {
  actionHistory: null
}

const mapStateToProps = ({ actionHistory, auth }) => ({
  auth,
  actionHistory
})

export default connect(mapStateToProps, { login: loginAction })(ErrorBoundary)
