import { deepPurple } from '@mui/material/colors'
import { createTheme } from '@mui/material/styles'

declare module '@mui/material/styles' {
  interface Palette {
    export: string
    graduationTimes: {
      onTime: string
      yearOver: string
      wayOver: string
    }
  }
  interface PaletteOptions {
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
    export: deepPurple[500],
    graduationTimes: {
      onTime: '#90a959',
      yearOver: '#fee191',
      wayOver: '#fb6962',
    },
  },
})
