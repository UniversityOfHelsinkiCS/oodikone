import React, { useEffect } from 'react'
import { initShibbolethPinger } from 'unfuck-spa-shibboleth-session'
import * as Sentry from '@sentry/browser'

import { NavigationBar } from 'components/NavigationBar'
import { Routes } from 'components/Routes'
import { SegmentDimmer } from 'components/SegmentDimmer'
import './app.css'
import { isProduction } from 'conf'
import { useGetAuthorizedUserQuery } from 'redux/auth'
import { AccessDenied } from 'components/AccessDenied'

const addUserDetailsToLoggers = ({ id, userId, mockedBy }) => {
  if (!isProduction || !id || !userId) return
  Sentry.setUser({
    id,
    username: userId,
    mockedBy,
  })
}

const Layout = ({ children }) => (
  <div className="appContainer">
    <main className="routeViewContainer">
      <header className="header" role="banner" id="main-menu">
        <NavigationBar />
      </header>
      {children}
    </main>
  </div>
)

export const App = () => {
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
