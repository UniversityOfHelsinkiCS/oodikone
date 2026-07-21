import blue from '@mui/material/colors/blue'
import blueGrey from '@mui/material/colors/blueGrey'
import deepPurple from '@mui/material/colors/deepPurple'
import green from '@mui/material/colors/green'
import grey from '@mui/material/colors/grey'
import indigo from '@mui/material/colors/indigo'
import orange from '@mui/material/colors/orange'
import purple from '@mui/material/colors/purple'
import red from '@mui/material/colors/red'

import createTheme from '@mui/material/styles/createTheme'

import '@fontsource/ibm-plex-sans/300.css'
import '@fontsource/ibm-plex-sans/400.css'
import '@fontsource/ibm-plex-sans/500.css'
import '@fontsource/ibm-plex-sans/700.css'

const baseTheme = {
  cssVariables: true,
  typography: {
    fontFamily: '"IBM Plex Sans", "Helvetica Neue", "Arial", sans-serif',
  },
  palette: {
    primary: { main: indigo[500], light: indigo[100], dark: indigo[700], contrastText: '#fff' },
    secondary: { main: deepPurple[500], light: deepPurple[300], dark: deepPurple[700] },
    text: { primary: grey[900], secondary: grey[600] },
    info: { main: blue[700], light: blue[500], dark: blue[900] },

    success: { main: green[600] },
    disabled: { main: grey[500] },

    activeNavigationTab: '#fff',
    graduationTimes: {
      onTime: '#90a959',
      yearOver: '#fee191',
      wayOver: '#fb6962',
    },
    ooditable: {
      hops: grey[700],
      recentEnrollment: orange[500],
      success: green[600],
      enrollment: grey[700],
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
      pinned: grey[900],
      unpinned: grey[300],
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
    degreeProgrammeType: {
      bachelor: blueGrey[50],
      master: blueGrey[100],
      licentiate: blueGrey[200],
      doctor: blueGrey[200],
      postgrad: blueGrey[300],
    },
    graphColors: ['#7cb5ec', '#90ed7d', '#434348', '#f7a35c', '#FFF000', '#2b908f', '#f45b5b', '#91e8e1'],
  },
}

type CustomPalette = {
  activeNavigationTab: string
  graduationTimes: {
    onTime: string
    yearOver: string
    wayOver: string
  }
  ooditable: {
    hops: string
    recentEnrollment: string
    success: string
    enrollment: string
  }
  grades: {
    all: string
    enrolledNoGrade: string
    fail: string
    tt: string
    ht: string
    pass: string
    grade1: string
    grade2: string
    grade3: string
    grade4: string
    grade5: string
    i: string
    a: string
    nsla: string
    lub: string
    cl: string
    mcla: string
    ecla: string
    l: string
  }
  studyProgrammePin: {
    pinned: string
    unpinned: string
  }
  roles: {
    admin: string
    fullSisuAccess: string
  }
  courseVisibility: {
    noCourses: string
    hidden: string
    partial: string
    visible: string
  }
  degreeProgrammeType: {
    bachelor: string
    master: string
    licentiate: string
    doctor: string
    postgrad: string
  }
  graphColors: string[]
}

declare module '@mui/material/styles' {
  interface Palette extends CustomPalette {}
  interface PaletteOptions extends CustomPalette {}
}

export const theme = createTheme(baseTheme)
