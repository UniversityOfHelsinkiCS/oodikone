import { createTheme } from '@mui/material/styles'

declare module '@mui/material/styles' {
  interface Theme {
    graduationTimes: {
      onTime: string
      yearOver: string
      wayOver: string
    }
  }
  interface ThemeOptions {
    graduationTimes?: {
      onTime: string
      yearOver: string
      wayOver: string
    }
  }
}

export const theme = createTheme({
  graduationTimes: {
    onTime: '#90a959',
    yearOver: '#fee191',
    wayOver: '#fb6962',
  },
})
