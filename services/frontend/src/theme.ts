import { deepPurple } from '@mui/material/colors'
import { createTheme, ThemeOptions } from '@mui/material/styles'

const baseTheme = {
  palette: {
    activeNavigationTab: '#fff',
    export: deepPurple[500],
    graduationTimes: {
      onTime: '#90a959',
      yearOver: '#fee191',
      wayOver: '#fb6962',
    },
    grades: {
      pass: '#008000',
      fail: '#e5053a',
      generic: '#178aa5',
      enrolledNoGrade: '#e2726d',
    },
  },
} as const

type CustomPalette = typeof baseTheme.palette

declare module '@mui/material/styles' {
  interface Palette extends CustomPalette {}
  interface PaletteOptions extends CustomPalette {}
}

export const theme = createTheme(baseTheme as ThemeOptions)
