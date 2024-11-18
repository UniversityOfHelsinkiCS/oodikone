import { CssBaseline } from '@mui/material'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import * as Sentry from '@sentry/browser'
import { useEffect } from 'react'
import { initShibbolethPinger } from 'unfuck-spa-shibboleth-session'

import { AccessDenied } from '@/components/AccessDenied'
import { Footer } from '@/components/material/Footer'
import { NavigationBar } from '@/components/material/NavigationBar'
import { Routes } from '@/components/Routes'
import { SegmentDimmer } from '@/components/SegmentDimmer'
import { isProduction } from '@/conf'
import { useGetAuthorizedUserQuery } from '@/redux/auth'

const addUserDetailsToLoggers = ({ id, username, mockedBy }) => {
  if (!isProduction || !id || !username) {
    return
  }
  Sentry.setUser({ id, username, mockedBy })
}

const theme = createTheme({})

const Layout = ({ children }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
    }}
  >
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <NavigationBar />
      <main style={{ flex: 1 }}>{children}</main>
      <Footer />
    </ThemeProvider>
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

  if (error) {
    return <AccessDenied notEnabled />
  }

  return <Layout>{isLoading ? <SegmentDimmer isLoading={isLoading} /> : <Routes />}</Layout>
}
