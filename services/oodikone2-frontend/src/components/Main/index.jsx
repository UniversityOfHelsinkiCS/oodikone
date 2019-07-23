import React from 'react'
import { localize } from 'react-localize-redux'
import { BrowserRouter as Router } from 'react-router-dom'
import { BASE_PATH } from '../../constants'

import Header from '../Header'
import ErrorContainer from '../ErrorContainer'
import Routes from '../Routes'
import './main.css'

const Main = () => (
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

export default localize(Main, 'locale')
