import { green, red, yellow } from '@mui/material/colors'
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
    onTime: green[400],
    yearOver: yellow[400],
    wayOver: red[400],
  },
})
