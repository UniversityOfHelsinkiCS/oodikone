import {
  chart1,
  chart2,
  chart3,
  chart4,
  chart5,
  chart6,
  chart7,
  chart8,
  chart9,
  chart10,
  chart11,
  chart12,
  chart13,
  chart14,
  chart15,
  chart16,
  chart17,
  chart18,
  chart19,
  chart20,
  chart21,
  chart22,
  chart23,
  chart24,
  chart25,
  chart26,
  chart27,
  chart28,
  chart29,
  chart30,
  chart31,
  chart32,
  chart33,
  chart34,
  chart35

} from '../styles/variables'
/*
lightgreen: '#90EE90',
  chartblue: '#178aa5',
  chartdarkg: '#367a1c',
  chartlgreen: '#80e061',
  chartdarkred: '#a03530',
  chartlred: '#e2726d'
*/
import { chartblue, red, green, chartdarkg, chartlgreen, chartdarkred, chartlred } from '../styles/variables/colors'

export const routes = {
  index: { route: '/' },
  populations: { route: '/populations', translateId: 'populations' },
  students: { route: '/students/:studentNumber?', translateId: 'students' },
  courseStatistics: { route: '/coursestatistics', translateId: 'courseStatistics' },
  courseGroups: { route: '/course-groups/:courseGroupId?/:action?', translateId: 'courseGroups', reqRights: ['coursegroups'] },
  studyProgramme: { route: '/study-programme/:studyProgrammeId?', translateId: 'studyProgramme', admin: true, reqRights: ['admin'] },
  teachers: { route: '/teachers/:teacherid?', translateId: 'teachers', czar: true, reqRights: ['teachers'] },
  users: { route: '/users/:userid?', translateId: 'users', admin: true, reqRights: ['users'] },
  settings: { route: '/settings', translateId: 'settings', admin: true, reqRights: ['admin'] },
  usage: { route: '/usage', translateId: 'usage', reqRights: ['usage'] },
  sandbox: { route: '/sandbox', translateId: 'sandbox', admin: true, reqRights: ['admin'] },
  oodilearn: { route: '/oodilearn', translateId: 'oodilearn', admin: true, reqRights: ['oodilearn'] }
}

export const hiddenRoutes = {
}

const assumeBasename = () => {
  const POSSIBLE_BASENAMES = ['staging', 'testing']
  const haystack = window.location.pathname.split('/')
  const needle = haystack.find(path => POSSIBLE_BASENAMES.includes(path))
  return needle ? `/${needle}/` : '/'
}

export const BASE_PATH = assumeBasename()

export const API_BASE_PATH = `${assumeBasename()}api`

export const AVAILABLE_LANGUAGES = ['en']
export const DEFAULT_LANG = 'en'

export const DISPLAY_DATE_FORMAT = 'DD.MM.YYYY'
export const API_DATE_FORMAT = 'YYYY.MM.DD'

export const TOKEN_NAME = window.location.pathname.includes('/staging') ? 'staging_token' : window.location.pathname.includes('/testing') ? 'testing_token' : 'token' //eslint-disable-line

export const passRateCumGraphOptions = (categories, max) => ({
  chart: {
    type: 'column'
  },
  colors: [chartblue, green, red],

  title: {
    text: 'Pass rate chart'
  },

  xAxis: {
    categories
  },

  yAxis: {
    allowDecimals: false,
    title: {
      text: 'Number of Students'
    },
    max,
    floor: -max
  },

  plotOptions: {
    column: {
      stacking: 'normal',
      borderRadius: 3
    }
  }
})

export const passRateStudGraphOptions = (categories, max) => ({
  chart: {
    type: 'column'
  },
  colors: [chartblue, chartlgreen, chartdarkg, chartlred, chartdarkred],

  title: {
    text: 'Pass rate chart'
  },

  xAxis: {
    categories
  },

  yAxis: {
    allowDecimals: false,
    title: {
      text: 'Number of Students'
    },
    max,
    floor: -max
  },

  plotOptions: {
    column: {
      stacking: 'normal',
      borderRadius: 1
    }
  }
})

export const gradeGraphOptions = (categories, max) => ({
  chart: {
    type: 'column'
  },
  colors: [red, chartblue, chartblue, chartblue, chartblue, chartblue, chartblue, chartblue],

  title: {
    text: 'Grades'
  },

  legend: {
    enabled: false
  },

  xAxis: {
    categories
  },

  yAxis: {
    allowDecimals: false,
    title: {
      text: 'Number of Students'
    },
    max,
    floor: -max
  },

  plotOptions: {
    column: {
      stacking: 'normal',
      borderRadius: 2
    }
  }
})

export const CHART_COLORS = [
  chart1,
  chart2,
  chart3,
  chart4,
  chart5,
  chart6,
  chart7,
  chart8,
  chart9,
  chart10,
  chart11,
  chart12,
  chart13,
  chart14,
  chart15,
  chart16,
  chart17,
  chart18,
  chart19,
  chart20,
  chart21,
  chart22,
  chart23,
  chart24,
  chart25,
  chart26,
  chart27,
  chart28,
  chart29,
  chart30,
  chart31,
  chart32,
  chart33,
  chart34,
  chart35
]
