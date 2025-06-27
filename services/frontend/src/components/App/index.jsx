import CssBaseline from '@mui/material/CssBaseline'
import ThemeProvider from '@mui/material/styles/ThemeProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider/LocalizationProvider'

import * as Sentry from '@sentry/browser'
import dayjs from 'dayjs'
import updateLocale from 'dayjs/plugin/updateLocale'
import HighCharts from 'highcharts'
import { useEffect } from 'react'
import { initShibbolethPinger } from 'unfuck-spa-shibboleth-session'

import { LanguageProvider } from '@/components/LanguagePicker/useLanguage'
import { AccessDenied } from '@/components/material/AccessDenied'
import { Footer } from '@/components/material/Footer'
import { NavigationBar } from '@/components/material/NavigationBar'
import { StatusNotification } from '@/components/material/StatusNotification'
import { StatusNotificationProvider } from '@/components/material/StatusNotificationContext'
import { Routes } from '@/components/Routes'
import { SegmentDimmer } from '@/components/SegmentDimmer'
import { isProduction } from '@/conf'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { theme } from '@/theme'

// TODO: What other options should be set globally?
HighCharts.setOptions({
  credits: {
    enabled: false,
  },
  plotOptions: {
    series: {
      animation: false,
    },
  },
  title: {
    text: '',
  },
})

dayjs.extend(updateLocale)
dayjs.updateLocale('en', {
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
    <LanguageProvider>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <ThemeProvider theme={theme}>
          <StatusNotificationProvider>
            <CssBaseline />
            <NavigationBar />
            <main style={{ flex: 1 }}>{children}</main>
            <StatusNotification />
            <Footer />
          </StatusNotificationProvider>
        </ThemeProvider>
      </LocalizationProvider>
    </LanguageProvider>
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
