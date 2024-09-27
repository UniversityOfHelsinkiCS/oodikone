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
  colors: isRelative
    ? [color.green, color.red, chartColor.redLight]
    : [chartColor.blue, color.green, color.red, chartColor.redLight],
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
    ? [chartColor.greenDark, chartColor.redDark, chartColor.redLight]
    : [chartColor.blue, chartColor.greenDark, chartColor.redDark, chartColor.redLight],
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
  const enrolledNoGrade = [] as number[]

  stats.forEach(year => {
    const { passed: p, failed: f } = year.attempts.categories
    const { totalEnrollments } = year.attempts
    all.push(totalEnrollments || p + f)
    passed.push(p)
    failed.push(f)
    enrolledNoGrade.push(totalEnrollments - p - f)
  })

  return {
    absolute: [
      getDataObject('all', all, 'a'),
      getDataObject('passed', passed, 'b'),
      getDataObject('failed', failed, 'c'),
      getDataObject('enrolled, no grade', enrolledNoGrade, 'c'),
    ],
    relative: [
      getDataObject('passed', passed.map(absoluteToRelative(all)), 'a'),
      getDataObject('failed', failed.map(absoluteToRelative(all)), 'a'),
      getDataObject('enrolled, no grade', enrolledNoGrade.map(absoluteToRelative(all)), 'a'),
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

  const passed = passedFirst.map((value, index) => value + passedEventually[index])

  return {
    absolute: [
      getDataObject('all', all, 'a'),
      getDataObject('passed', passed, 'b'),
      getDataObject('never passed', neverPassed, 'c'),
      getDataObject('enrolled, no grade', enrolledNoGrade, 'c'),
    ],
    relative: [
      getDataObject('passed', passed.map(absoluteToRelative(all)), 'a'),
      getDataObject('never passed', neverPassed.map(absoluteToRelative(all)), 'a'),
      getDataObject('enrolled, no grade', enrolledNoGrade.map(absoluteToRelative(all)), 'a'),
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
  const passRateGraphSeries = isAttemptsMode
    ? getPassRateAttemptSeriesFromStats(stats)
    : getPassRateStudentSeriesFromStats(stats)

  const maxPassRateVal = isRelative ? 100 : getMaxValueOfSeries(passRateGraphSeries.absolute)
  const graphOptions = isAttemptsMode ? passRateAttemptGraphOptions : passRateStudentGraphOptions
  const primaryGraphOptions = graphOptions(isRelative, statYears, maxPassRateVal, `Pass rate for group ${data.name}`)

  return (
    <div>
      <ReactHighcharts
        config={{
          ...primaryGraphOptions,
          series: isRelative ? passRateGraphSeries.relative : passRateGraphSeries.absolute,
        }}
      />
      {!userHasAccessToAllStats && (
        <span className="totalsDisclaimer">* Years with 5 students or fewer are shown as 0 in the chart</span>
      )}
    </div>
  )
}
