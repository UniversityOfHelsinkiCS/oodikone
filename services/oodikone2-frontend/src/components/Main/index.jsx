import React, { useEffect } from 'react'
import { createBrowserHistory } from 'history'
import { Router } from 'react-router-dom'
import { initShibbolethPinger } from 'unfuck-spa-shibboleth-session'
import TSA from '../../common/tsa'
import { BASE_PATH } from '../../constants'
import Header from '../Header'
import ErrorContainer from '../ErrorContainer'
import Routes from '../Routes'
import SisChangeMessage from './SisChangeMessage'
import './main.css'

const history = TSA.Matomo.connectToHistory(createBrowserHistory())

export default () => {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      initShibbolethPinger(60000, window.location.origin)
    }
  }, [])

  return (
    <div className="appContainer">
      <Router basename={BASE_PATH} history={history}>
        <main className="routeViewContainer">
          <Header />
          <SisChangeMessage />
          <ErrorContainer />
          <Routes />
        </main>
      </Router>
    </div>
  )
}
