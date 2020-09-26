import React from 'react'
import { createBrowserHistory } from 'history'
import { Router } from 'react-router-dom'
import TSA from '../../common/tsa'
import { BASE_PATH } from '../../constants'
import Header from '../Header'
import ErrorContainer from '../ErrorContainer'
import Routes from '../Routes'
import './main.css'

const history = TSA.Matomo.connectToHistory(createBrowserHistory())

export default () => (
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
