import { CssBaseline } from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import * as Sentry from '@sentry/browser'
import moment from 'moment'
import { useEffect } from 'react'
import { initShibbolethPinger } from 'unfuck-spa-shibboleth-session'

import { AccessDenied } from '@/components/AccessDenied'
import { Footer } from '@/components/material/Footer'
import { NavigationBar } from '@/components/material/NavigationBar'
import { Routes } from '@/components/Routes'
import { SegmentDimmer } from '@/components/SegmentDimmer'
import { isProduction } from '@/conf'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { theme } from '@/theme'

moment.updateLocale('en', {
  week: {
    dow: 1, // First day of week is Monday
  },
})

const addUserDetailsToLoggers = ({ id, username, mockedBy }) => {
  if (!isProduction || !id || !username) {
    return
  }
  Sentry.setUser({ id, username, mockedBy })
}

const Layout = ({ children }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
    }}
  >
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <NavigationBar />
        <main style={{ flex: 1 }}>{children}</main>
        <Footer />
      </ThemeProvider>
    </LocalizationProvider>
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
