import { color, chartColor } from 'styles/colors'

export const DEFAULT_LANG = 'fi'
export const DISPLAY_DATE_FORMAT = 'DD.MM.YYYY'
export const DISPLAY_DATE_FORMAT_DEV = 'DD.MM.YYYY HH:mm:ss'
export const API_DATE_FORMAT = 'YYYY.MM.DD'

export const passRateAttemptGraphOptions = (isRelative, categories, max, title) => ({
  chart: {
    type: 'column',
  },
  colors: isRelative ? [color.green, color.red] : [chartColor.blue, color.green, color.red],
  credits: {
    text: 'oodikone | TOSKA',
  },
  title: {
    text: title,
  },
  xAxis: {
    categories,
  },
  yAxis: {
    allowDecimals: false,
    title: {
      text: isRelative ? 'Share of Students' : 'Number of Students',
    },
    max,
    floor: -max,
  },
  plotOptions: {
    column: {
      stacking: 'normal',
      borderRadius: 3,
    },
    series: {
      tooltip: {
        valueSuffix: isRelative ? '%' : '',
      },
    },
  },
})

export const passRateStudentGraphOptions = (isRelative, categories, max, title) => ({
  chart: {
    type: 'column',
  },
  colors: isRelative
    ? [chartColor.greenLight, chartColor.greenDark, chartColor.redLight, chartColor.redDark]
    : [chartColor.blue, chartColor.greenLight, chartColor.greenDark, chartColor.redLight, chartColor.redDark],
  credits: {
    text: 'oodikone | TOSKA',
  },
  title: {
    text: title,
  },
  xAxis: {
    categories,
  },
  yAxis: {
    allowDecimals: false,
    title: {
      text: isRelative ? 'Share of Students' : 'Number of Students',
    },
    max,
    floor: -max,
  },
  plotOptions: {
    column: {
      stacking: 'normal',
      borderRadius: 1,
    },
    series: {
      tooltip: {
        valueSuffix: isRelative ? '%' : '',
      },
    },
  },
})

export const gradeGraphOptions = (isRelative, categories, max, title) => ({
  chart: {
    type: 'column',
  },
  colors: [
    color.red,
    chartColor.blue,
    chartColor.blue,
    chartColor.blue,
    chartColor.blue,
    chartColor.blue,
    color.green,
    color.green,
  ],
  credits: {
    text: 'oodikone | TOSKA',
  },
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
      text: isRelative ? 'Share of Students' : 'Number of Students',
    },
    max,
    floor: -max,
  },
  plotOptions: {
    column: {
      stacking: 'normal',
      borderRadius: 2,
    },
    series: {
      tooltip: {
        valueSuffix: isRelative ? '%' : '',
      },
    },
  },
})

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
