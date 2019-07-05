import React, { useEffect } from 'react'
import { localize } from 'react-localize-redux'
import { BrowserRouter as Router } from 'react-router-dom'
import { connect } from 'react-redux'
import { bool, func, shape, string } from 'prop-types'
import { BASE_PATH } from '../../constants'
import { login as loginAction } from '../../redux/auth'

import Header from '../Header'
import ErrorContainer from '../ErrorContainer'
import Routes from '../Routes'
import './main.css'

const Main = ({ auth: { token, error }, login }) => {
  useEffect(() => {
    login()
  }, [])
  if (!token && !error) return <div />
  return (
    <div className="appContainer">
      <Router basename={BASE_PATH}>
        <main className="routeViewContainer">
          <Header />
          <ErrorContainer />
          <Routes />
        </main>
      </Router>
    </div>
  )
}

Main.propTypes = {
  auth: shape({
    token: string,
    error: bool
  }),
  login: func.isRequired
}

Main.defaultProps = {
  auth: {
    token: null,
    error: false
  }
}

const mapStateToProps = state => ({
  auth: state.auth
})

const mapDispatchToProps = {
  login: loginAction
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(localize(Main, 'locale'))
