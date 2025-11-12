import CssBaseline from '@mui/material/CssBaseline'
import ThemeProvider from '@mui/material/styles/ThemeProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider/LocalizationProvider'

import * as Sentry from '@sentry/browser'
import dayjs, { extend as dayjsExtend } from 'dayjs'
import updateLocale from 'dayjs/plugin/updateLocale'
import HighCharts from 'highcharts' // eslint-disable-line import-x/default
import { useEffect } from 'react'
import { initShibbolethPinger } from 'unfuck-spa-shibboleth-session'

import { AccessDenied } from '@/components/AccessDenied'
import { Footer } from '@/components/Footer'
import { LanguageProvider } from '@/components/LanguagePicker/useLanguage'
import { NavigationBar } from '@/components/material/NavigationBar'
import { Routes } from '@/components/Routes'
import { SegmentDimmer } from '@/components/SegmentDimmer'
import { StatusNotification } from '@/components/StatusNotification'
import { StatusNotificationProvider } from '@/components/StatusNotification/Context'
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

dayjsExtend(updateLocale)
dayjs.updateLocale('en', {
  week: {
    dow: 1, // First day of week is Monday
  },
})

const Layout = ({ children }) => (
  <LanguageProvider>
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <ThemeProvider theme={theme}>
        <StatusNotificationProvider>{children}</StatusNotificationProvider>
      </ThemeProvider>
    </LocalizationProvider>
  </LanguageProvider>
)

export const App = () => {
  const { isLoading, error, id, username, mockedBy } = useGetAuthorizedUserQuery()

  useEffect(() => {
    if (isProduction) initShibbolethPinger()
  }, [])

  useEffect(() => {
    if (isProduction && !isLoading && id && username) Sentry.setUser({ id, username, mockedBy })
  }, [id, username, mockedBy])

  if (isLoading) return <SegmentDimmer isLoading />
  if (error) return <AccessDenied />

  return (
    <Layout>
      <CssBaseline />
      <NavigationBar />
      <Routes />
      <StatusNotification />
      <Footer />
    </Layout>
  )
}
