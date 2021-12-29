import React, { useEffect } from 'react'
import { initShibbolethPinger } from 'unfuck-spa-shibboleth-session'
import Header from '../Header'
import Routes from '../Routes'
import './app.css'
import { isDev } from '../../conf'

const App = () => {
  useEffect(() => {
    if (!isDev) {
      initShibbolethPinger(60000, window.location.origin)
    }
  }, [])

  return (
    <div className="appContainer">
      <main className="routeViewContainer">
        <Header />
        <Routes />
      </main>
    </div>
  )
}

export default App
