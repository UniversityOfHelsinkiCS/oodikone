import React, { useEffect } from 'react'
import { createBrowserHistory } from 'history'
import { Router } from 'react-router-dom'
import TSA from '../../common/tsa'
import { BASE_PATH } from '../../constants'
import Header from '../Header'
import ErrorContainer from '../ErrorContainer'
import Routes from '../Routes'
import './main.css'
import { callApi } from '../../apiConnection'

const history = TSA.Matomo.connectToHistory(createBrowserHistory())

export default () => {
  useEffect(() => {
    // Poll backend every 5 minutes to keep the connection alive.
    const interval = setInterval(() => {
      callApi('/ping')
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="appContainer">
      <Router basename={BASE_PATH} history={history}>
        <main className="routeViewContainer">
          <Header />
          <ErrorContainer />
          <Routes />
        </main>
      </Router>
    </div>
  )
}
