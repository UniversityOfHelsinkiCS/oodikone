import React, { useEffect } from 'react'
import { initShibbolethPinger } from 'unfuck-spa-shibboleth-session'
import * as Sentry from '@sentry/browser'
import TSA from 'common/tsa'
import Header from 'components/Header'
import Routes from 'components/Routes'
import SegmentDimmer from 'components/SegmentDimmer'
import './app.css'
import { isProduction } from 'conf'
import { useGetAuthorizedUserQuery } from 'redux/auth'
import AccessDenied from 'components/AccessDenied'

const addUserDetailsToLoggers = ({ id, userId, mockedBy }) => {
  if (!isProduction || !id || !userId) return
  Sentry.setUser({
    id,
    username: userId,
    mockedBy,
  })
  TSA.Matomo.setUserId(mockedBy || userId)
  if (mockedBy) {
    TSA.Matomo.sendEvent('Admin', 'Mocking user', userId)
  }
}

const Layout = ({ children }) => (
  <div className="appContainer">
    <main className="routeViewContainer">
      <Header />
      {children}
    </main>
  </div>
)

const App = () => {
  const { isLoading, error, id, userId, mockedBy } = useGetAuthorizedUserQuery()

  useEffect(() => {
    if (isProduction) {
      initShibbolethPinger()
    }
  }, [])

  useEffect(() => {
    addUserDetailsToLoggers({ id, userId, mockedBy })
  }, [id, userId, mockedBy])

  if (error) return <AccessDenied notEnabled />

  return <Layout>{isLoading ? <SegmentDimmer isLoading={isLoading} /> : <Routes />}</Layout>
}

export default App
