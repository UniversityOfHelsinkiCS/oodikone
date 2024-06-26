import * as Sentry from '@sentry/browser'
import { useEffect } from 'react'
import { initShibbolethPinger } from 'unfuck-spa-shibboleth-session'

import { AccessDenied } from '@/components/AccessDenied'
import { NavigationBar } from '@/components/NavigationBar'
import { Routes } from '@/components/Routes'
import { SegmentDimmer } from '@/components/SegmentDimmer'
import { isProduction } from '@/conf'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import './app.css'

const addUserDetailsToLoggers = ({ id, username, mockedBy }) => {
  if (!isProduction || !id || !username) return
  Sentry.setUser({ id, username, mockedBy })
}

const Layout = ({ children }) => (
  <div className="appContainer">
    <main className="routeViewContainer">
      <header className="header" id="main-menu" role="banner">
        <NavigationBar />
      </header>
      {children}
    </main>
  </div>
)

export const App = () => {
  const { isLoading, error, id, username, mockedBy } = useGetAuthorizedUserQuery()

  useEffect(() => {
    if (isProduction) {
      initShibbolethPinger()
    }
  }, [])

  useEffect(() => {
    addUserDetailsToLoggers({ id, username, mockedBy })
  }, [id, username, mockedBy])

  if (error) return <AccessDenied notEnabled />

  return <Layout>{isLoading ? <SegmentDimmer isLoading={isLoading} /> : <Routes />}</Layout>
}
