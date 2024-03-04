import React from 'react'
import ReactHighcharts from 'react-highcharts'
import { color, chartColor } from '@/styles/colors'
import {
  absoluteToRelative,
  getDataObject,
  getGradeSpread,
  getMaxValueOfSeries,
  getThesisGradeSpread,
  isThesisSeries,
} from '../util'

const gradeGraphOptions = (isRelative, categories, max, title) => ({
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
    href: 'https://toska.dev',
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

const getGradeSeries = series => {
  const isGradeSeries = !isThesisSeries(series)
  const newSeries = isGradeSeries ? getGradeSpread(series) : getThesisGradeSpread(series)
  const sumAll = Object.values(newSeries)[0].map((_, index) =>
    Object.values(newSeries)
      .map(series => series[index])
      .reduce((a, b) => a + b, 0)
  )
  return isGradeSeries
    ? {
        absolute: [
          getDataObject('0', newSeries[0], 'a'),
          getDataObject('1', newSeries[1], 'b'),
          getDataObject('2', newSeries[2], 'c'),
          getDataObject('3', newSeries[3], 'd'),
          getDataObject('4', newSeries[4], 'e'),
          getDataObject('5', newSeries[5], 'f'),
          getDataObject('HT', newSeries.HT, 'g'),
          getDataObject('TT', newSeries.TT, 'h'),
          getDataObject('Hyv.', newSeries['Hyv.'], 'i'),
        ],
        relative: [
          getDataObject('0', newSeries[0].map(absoluteToRelative(sumAll)), 'a'),
          getDataObject('1', newSeries[1].map(absoluteToRelative(sumAll)), 'b'),
          getDataObject('2', newSeries[2].map(absoluteToRelative(sumAll)), 'c'),
          getDataObject('3', newSeries[3].map(absoluteToRelative(sumAll)), 'd'),
          getDataObject('4', newSeries[4].map(absoluteToRelative(sumAll)), 'e'),
          getDataObject('5', newSeries[5].map(absoluteToRelative(sumAll)), 'f'),
          getDataObject('HT', newSeries.HT.map(absoluteToRelative(sumAll)), 'g'),
          getDataObject('TT', newSeries.TT.map(absoluteToRelative(sumAll)), 'h'),
          getDataObject('Hyv.', newSeries['Hyv.'].map(absoluteToRelative(sumAll)), 'i'),
        ],
      }
    : {
        absolute: [
          getDataObject('I', newSeries.I, 'a'),
          getDataObject('A', newSeries.A, 'b'),
          getDataObject('NSLA', newSeries.NSLA, 'c'),
          getDataObject('LUB', newSeries.LUB, 'd'),
          getDataObject('CL', newSeries.CL, 'e'),
          getDataObject('MCLA', newSeries.MCLA, 'f'),
          getDataObject('ECLA', newSeries.ECLA, 'g'),
          getDataObject('L', newSeries.L, 'h'),
        ],
        relative: [
          getDataObject('I', newSeries.I.map(absoluteToRelative(sumAll)), 'a'),
          getDataObject('A', newSeries.A.map(absoluteToRelative(sumAll)), 'b'),
          getDataObject('NSLA', newSeries.NSLA.map(absoluteToRelative(sumAll)), 'c'),
          getDataObject('LUB', newSeries.LUB.map(absoluteToRelative(sumAll)), 'd'),
          getDataObject('CL', newSeries.CL.map(absoluteToRelative(sumAll)), 'e'),
          getDataObject('MCLA', newSeries.MCLA.map(absoluteToRelative(sumAll)), 'f'),
          getDataObject('ECLA', newSeries.ECLA.map(absoluteToRelative(sumAll)), 'g'),
          getDataObject('L', newSeries.L.map(absoluteToRelative(sumAll)), 'h'),
        ],
      }
}

export const GradeDistributionChart = ({ data, isRelative, userHasAccessToAllStats }) => {
  const stats = data.stats.filter(stat => stat.name !== 'Total' || isRelative)

  const statYears = stats.map(year => year.name)
  const grades = stats.flatMap(s => s.attempts.grades)

  const gradeGraphSeries = getGradeSeries(grades)

  const maxGradeValue = isRelative ? 100 : getMaxValueOfSeries(gradeGraphSeries.absolute)

  const primaryDistributionOptions = gradeGraphOptions(
    isRelative,
    statYears,
    maxGradeValue,
    `Grades for group ${data.name}`
  )

  return (
    <div>
      <ReactHighcharts
        config={{
          ...primaryDistributionOptions,
          series: isRelative ? gradeGraphSeries.relative : gradeGraphSeries.absolute,
        }}
      />
      {!userHasAccessToAllStats && (
        <span className="totalsDisclaimer">* Years with 5 students or less are shown as 0 in the chart</span>
      )}
    </div>
  )
}
