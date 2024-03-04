import React from 'react'
import ReactHighcharts from 'react-highcharts'
import { creditsHref, creditsText } from '@/constants'
import { color, chartColor } from '@/styles/colors'
import { absoluteToRelative, getDataObject, getMaxValueOfSeries } from '../util'

const passRateAttemptGraphOptions = (isRelative, categories, max, title) => ({
  chart: {
    type: 'column',
  },
  colors: isRelative ? [color.green, color.red] : [chartColor.blue, color.green, color.red],
  credits: {
    href: creditsHref,
    text: creditsText,
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

const passRateStudentGraphOptions = (isRelative, categories, max, title) => ({
  chart: {
    type: 'column',
  },
  colors: isRelative
    ? [chartColor.greenLight, chartColor.greenDark, chartColor.redLight, chartColor.redDark]
    : [chartColor.blue, chartColor.greenLight, chartColor.greenDark, chartColor.redLight, chartColor.redDark],
  credits: {
    href: creditsHref,
    text: creditsText,
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

const getPassRateAttemptSeriesFromStats = stats => {
  const all = []
  const passed = []
  const failed = []

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
  const all = []
  const passedFirst = []
  const passedEventually = []
  const neverPassed = []
  const enrolledNoGrade = []

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

export const PassRateChart = ({ data, isRelative, userHasAccessToAllStats, viewMode }) => {
  const isAttemptsMode = viewMode === 'ATTEMPTS'

  const stats = data.stats.filter(stat => stat.name !== 'Total')
  const statYears = stats.map(year => year.name)
  const passGraphSeries = isAttemptsMode
    ? getPassRateAttemptSeriesFromStats(stats)
    : getPassRateStudentSeriesFromStats(stats)

  const maxPassRateVal = isRelative ? 100 : getMaxValueOfSeries(passGraphSeries.absolute)
  const graphOptionsFn = isAttemptsMode ? passRateAttemptGraphOptions : passRateStudentGraphOptions
  const primaryGraphOptions = graphOptionsFn(isRelative, statYears, maxPassRateVal, `Pass rate for group ${data.name}`)

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
