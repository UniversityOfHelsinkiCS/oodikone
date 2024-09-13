import accessibility from 'highcharts/modules/accessibility'
import exportData from 'highcharts/modules/export-data'
import exporting from 'highcharts/modules/exporting'
import ReactHighcharts from 'react-highcharts'

import {
  absoluteToRelative,
  getDataObject,
  getMaxValueOfSeries,
} from '@/components/CourseStatistics/ResultTabs/panes/util'
import { chartColor, color } from '@/styles/colors'

exporting(ReactHighcharts.Highcharts)
exportData(ReactHighcharts.Highcharts)
accessibility(ReactHighcharts.Highcharts)

const passRateAttemptGraphOptions = (isRelative: boolean, categories: string[], max: number, title: string) => ({
  chart: {
    type: 'column',
  },
  colors: isRelative ? [color.green, color.red] : [chartColor.blue, color.green, color.red],
  credits: {
    enabled: false,
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
      text: isRelative ? 'Share of students' : 'Number of students',
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

const passRateStudentGraphOptions = (isRelative: boolean, categories: string[], max: number, title: string) => ({
  chart: {
    type: 'column',
  },
  colors: isRelative
    ? [chartColor.greenLight, chartColor.greenDark, chartColor.redLight, chartColor.redDark]
    : [chartColor.blue, chartColor.greenLight, chartColor.greenDark, chartColor.redLight, chartColor.redDark],
  credits: {
    enabled: false,
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
      text: isRelative ? 'Share of students' : 'Number of students',
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

const getPassRateAttemptSeriesFromStats = stats => {
  const all = [] as number[]
  const passed = [] as number[]
  const failed = [] as number[]

  stats.forEach(year => {
    const { passed: p, failed: f } = year.attempts.categories
    all.push(p + f)
    passed.push(p)
    failed.push(f)
  })

  return {
    absolute: [
      getDataObject('all', all, 'a'),
      getDataObject('passed', passed, 'b'),
      getDataObject('failed', failed, 'c'),
    ],
    relative: [
      getDataObject('passed', passed.map(absoluteToRelative(all)), 'b'),
      getDataObject('failed', failed.map(absoluteToRelative(all)), 'c'),
    ],
  }
}

const getPassRateStudentSeriesFromStats = stats => {
  const all = [] as number[]
  const passedFirst = [] as number[]
  const passedEventually = [] as number[]
  const neverPassed = [] as number[]
  const enrolledNoGrade = [] as number[]

  stats.forEach(year => {
    const { passedFirst: pf, passedEventually: pe, neverPassed: np } = year.students.categories
    const enrolledWithNoGrade = year.students.enrolledStudentsWithNoGrade

    all.push((pf || 0) + (pe || 0) + (np || 0) + (enrolledWithNoGrade || 0))
    passedFirst.push(pf || 0)
    passedEventually.push(pe || 0)
    neverPassed.push(np || 0)
    enrolledNoGrade.push(enrolledWithNoGrade || 0)
  })

  return {
    absolute: [
      getDataObject('all', all, 'a'),
      getDataObject('passed on first try', passedFirst, 'b'),
      getDataObject('passed eventually', passedEventually, 'b'),
      getDataObject('never passed', neverPassed, 'c'),
      getDataObject('enrolled, no grade', enrolledNoGrade, 'c'),
    ],
    relative: [
      getDataObject('passed on first try', passedFirst.map(absoluteToRelative(all)), 'b'),
      getDataObject('passed eventually', passedEventually.map(absoluteToRelative(all)), 'b'),
      getDataObject('never passed', neverPassed.map(absoluteToRelative(all)), 'c'),
      getDataObject('enrolled, no grade', enrolledNoGrade.map(absoluteToRelative(all)), 'c'),
    ],
  }
}

interface PassRateChartProps {
  data: any
  isRelative: boolean
  userHasAccessToAllStats: boolean
  viewMode: 'ATTEMPTS' | 'STUDENTS'
}

export const PassRateChart = ({ data, isRelative, userHasAccessToAllStats, viewMode }: PassRateChartProps) => {
  const stats = data.stats.filter(stat => stat.name !== 'Total')
  const statYears = stats.map(year => year.name)

  const isAttemptsMode = viewMode === 'ATTEMPTS'
  const passGraphSeries = isAttemptsMode
    ? getPassRateAttemptSeriesFromStats(stats)
    : getPassRateStudentSeriesFromStats(stats)

  const maxPassRateVal = isRelative ? 100 : getMaxValueOfSeries(passGraphSeries.absolute)
  const graphOptions = isAttemptsMode ? passRateAttemptGraphOptions : passRateStudentGraphOptions
  const primaryGraphOptions = graphOptions(isRelative, statYears, maxPassRateVal, `Pass rate for group ${data.name}`)

  return (
    <div>
      <ReactHighcharts
        config={{ ...primaryGraphOptions, series: isRelative ? passGraphSeries.relative : passGraphSeries.absolute }}
      />
      {!userHasAccessToAllStats && (
        <span className="totalsDisclaimer">* Years with 5 students or less are shown as 0 in the chart</span>
      )}
    </div>
  )
}
