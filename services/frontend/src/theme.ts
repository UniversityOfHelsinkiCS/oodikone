import { blue, blueGrey, deepPurple, green, grey, indigo, orange, purple, red } from '@mui/material/colors'
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
      all: indigo[300],
      enrolledNoGrade: orange[300],
      fail: red[300],
      tt: green[100],
      ht: green[200],
      pass: green[300],
      grade1: blue[100],
      grade2: blue[200],
      grade3: blue[300],
      grade4: blue[400],
      grade5: blue[500],
      i: purple[100],
      a: purple[200],
      nsla: purple[300],
      lub: purple[400],
      cl: purple[500],
      mcla: purple[600],
      ecla: purple[700],
      l: purple[800],
    },
    studyProgrammePin: {
      pinned: blueGrey[900],
      unpinned: blueGrey[100],
    },
    roles: {
      admin: red[300],
      fullSisuAccess: orange[300],
    },
    courseVisibility: {
      noCourses: grey[800],
      hidden: red[800],
      partial: orange[800],
      visible: green[800],
    },
  },
} as const

type CustomPalette = typeof baseTheme.palette

declare module '@mui/material/styles' {
  interface Palette extends CustomPalette {}
  interface PaletteOptions extends CustomPalette {}
}

export const theme = createTheme(baseTheme as ThemeOptions)
