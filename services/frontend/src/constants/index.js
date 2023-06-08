import colors from '../styles/variables'

const {
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
  chart35,
} = colors

const { chartblue, red, green, chartdarkg, chartlgreen, chartdarkred, chartlred } = colors

export const AVAILABLE_LANGUAGES = [
  { name: 'fi', code: 'fi' },
  { name: 'en', code: 'en' },
  { name: 'sv', code: 'sv' },
]
export const DEFAULT_LANG = 'fi'
export const DISPLAY_DATE_FORMAT = 'DD.MM.YYYY'
export const DISPLAY_DATE_FORMAT_DEV = 'DD.MM.YYYY HH:mm:ss'
export const API_DATE_FORMAT = 'YYYY.MM.DD'

export const passRateAttemptGraphOptions = (categories, max, title, skipFirstColor) => ({
  chart: {
    type: 'column',
  },
  colors: skipFirstColor ? [green, red] : [chartblue, green, red],

  title: {
    text: title,
  },

  xAxis: {
    categories,
  },

  yAxis: {
    allowDecimals: false,
    title: {
      text: 'Number of Students',
    },
    max,
    floor: -max,
  },

  plotOptions: {
    column: {
      stacking: 'normal',
      borderRadius: 3,
    },
  },
})

export const passRateStudGraphOptions = (categories, max, title, skipFirstColor) => ({
  chart: {
    type: 'column',
  },
  colors: skipFirstColor
    ? [chartlgreen, chartdarkg, chartlred, chartdarkred]
    : [chartblue, chartlgreen, chartdarkg, chartlred, chartdarkred],

  title: {
    text: title,
  },

  xAxis: {
    categories,
  },

  yAxis: {
    allowDecimals: false,
    title: {
      text: 'Number of Students',
    },
    max,
    floor: -max,
  },

  plotOptions: {
    column: {
      stacking: 'normal',
      borderRadius: 1,
    },
  },
})

export const gradeGraphOptions = (categories, max, title) => ({
  chart: {
    type: 'column',
  },
  colors: [red, chartblue, chartblue, chartblue, chartblue, chartblue, green, green],

  title: {
    text: title,
  },

  legend: {
    enabled: false,
  },

  xAxis: {
    categories,
  },

  yAxis: {
    allowDecimals: false,
    title: {
      text: 'Number of Students',
    },
    max,
    floor: -max,
  },

  plotOptions: {
    column: {
      stacking: 'normal',
      borderRadius: 2,
    },
  },
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
  chart35,
]

export const PRIORITYCODE_TEXTS = {
  1: 'Main',
  2: 'Secondary',
  6: 'Option',
  30: 'Graduated',
}

// Increment this if search history code changes
// so it will be reseted for all users.
export const SEARCH_HISTORY_VERSION = '1.0'

export const LANGUAGE_CODES = ['fi', 'en', 'sv']
