import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import { localize } from 'react-localize-redux'
import { createBrowserHistory } from 'history'
import { Router } from 'react-router-dom'
import TSA from '../../common/tsa'
import { BASE_PATH } from '../../constants'

import Header from '../Header'
import ErrorContainer from '../ErrorContainer'
import Routes from '../Routes'
import './main.css'

const history = TSA.Matomo.connectToHistory(createBrowserHistory())

const TSAUserIdHook = connect(state => ({ token: state.auth.token }))(({ token }) => {
  // todo: if we upgrade redux and thus get access to its hooks,
  // replace this hocc'd component with an actual hook
  const userId = token ? token.userId : undefined

  useEffect(() => {
    TSA.Matomo.setUserId(userId)
  }, [userId])

  return null
})

const Main = () => (
  <div className="appContainer">
    <TSAUserIdHook />
    <Router basename={BASE_PATH} history={history}>
      <main className="routeViewContainer">
        <Header />
        <ErrorContainer />
        <Routes />
      </main>
    </Router>
  </div>
)

export default localize(Main, 'localize')
