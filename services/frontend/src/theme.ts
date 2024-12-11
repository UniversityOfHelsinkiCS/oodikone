import { deepPurple } from '@mui/material/colors'
import { createTheme } from '@mui/material/styles'

declare module '@mui/material/styles' {
  interface Palette {
    activeNavigationTab: string
    export: string
    graduationTimes: {
      onTime: string
      yearOver: string
      wayOver: string
    }
  }
  interface PaletteOptions {
    activeNavigationTab: string
    export: string
    graduationTimes?: {
      onTime: string
      yearOver: string
      wayOver: string
    }
  }
}

export const theme = createTheme({
  palette: {
    activeNavigationTab: '#fff',
    export: deepPurple[500],
    graduationTimes: {
      onTime: '#90a959',
      yearOver: '#fee191',
      wayOver: '#fb6962',
    },
  },
})
