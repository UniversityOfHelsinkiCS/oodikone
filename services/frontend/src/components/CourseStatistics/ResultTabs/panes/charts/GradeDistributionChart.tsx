import accessibility from 'highcharts/modules/accessibility'
import exportData from 'highcharts/modules/export-data'
import exporting from 'highcharts/modules/exporting'
import ReactHighcharts from 'react-highcharts'

import {
  absoluteToRelative,
  getDataObject,
  getGradeSpread,
  getMaxValueOfSeries,
  getSeriesType,
  getThesisGradeSpread,
} from '@/components/CourseStatistics/ResultTabs/panes/util'
import { chartColor, color } from '@/styles/colors'

exporting(ReactHighcharts.Highcharts)
exportData(ReactHighcharts.Highcharts)
accessibility(ReactHighcharts.Highcharts)

const getGradeGraphOptions = (
  colors: string[],
  maxGradeValue: number,
  isRelative: boolean,
  statYears: string[],
  title: string
) => ({
  chart: {
    type: 'column',
  },
  colors,
  credits: {
    enabled: false,
  },
  title: {
    text: title,
  },
  legend: {
    enabled: false,
  },
  xAxis: {
    categories: statYears,
  },
  yAxis: {
    allowDecimals: false,
    title: {
      text: isRelative ? 'Share of students' : 'Number of students',
    },
    max: maxGradeValue,
    floor: -maxGradeValue,
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

const calculateSumAll = (newSeries: Record<string, number[]>) => {
  return Object.values(newSeries)[0].map((_, index) =>
    Object.values(newSeries)
      .map(series => series[index])
      .reduce((a, b) => a + b, 0)
  )
}

const getGradeSeries = (series: Array<Record<string, number>>) => {
  const seriesType = getSeriesType(series)
  const newSeries =
    seriesType === 'thesis'
      ? (getThesisGradeSpread(series) as Record<string, number[]>)
      : (getGradeSpread(series) as Record<string, number[]>)
  const sumAll = calculateSumAll(newSeries)

  if (seriesType === 'thesis') {
    return {
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

  if (seriesType === 'second-national-language') {
    return {
      absolute: [
        getDataObject('0', newSeries[0], 'a'),
        getDataObject('TT', newSeries.TT, 'b'),
        getDataObject('HT', newSeries.HT, 'c'),
        getDataObject('Hyv.', newSeries['Hyv.'], 'd'),
      ],
      relative: [
        getDataObject('0', newSeries[0].map(absoluteToRelative(sumAll)), 'a'),
        getDataObject('TT', newSeries.TT.map(absoluteToRelative(sumAll)), 'b'),
        getDataObject('HT', newSeries.HT.map(absoluteToRelative(sumAll)), 'c'),
        getDataObject('Hyv.', newSeries['Hyv.'].map(absoluteToRelative(sumAll)), 'd'),
      ],
    }
  }

  if (seriesType === 'pass-fail') {
    return {
      absolute: [getDataObject('0', newSeries[0], 'a'), getDataObject('Hyv.', newSeries['Hyv.'], 'b')],
      relative: [
        getDataObject('0', newSeries[0].map(absoluteToRelative(sumAll)), 'a'),
        getDataObject('Hyv.', newSeries['Hyv.'].map(absoluteToRelative(sumAll)), 'b'),
      ],
    }
  }

  return {
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
}

const getGrades = students => {
  const grades = { ...students.grades }
  const enrolledWithNoGrade = students.enrolledStudentsWithNoGrade || 0
  grades[0] = (grades[0] || 0) + enrolledWithNoGrade
  return grades
}

export const GradeDistributionChart = ({ data, isRelative, userHasAccessToAllStats }) => {
  const stats = data.stats.filter(stat => stat.name !== 'Total' || isRelative)

  const statYears = stats.map(year => year.name)
  const grades = stats.map(year => getGrades(year.students))

  const gradeGraphSeries = getGradeSeries(grades)
  const seriesType = getSeriesType(grades)

  const maxGradeValue = isRelative ? 100 : getMaxValueOfSeries(gradeGraphSeries.absolute)
  const title = `Grades for group ${data.name}`

  const colors = {
    other: [
      color.red,
      chartColor.blue,
      chartColor.blue,
      chartColor.blue,
      chartColor.blue,
      chartColor.blue,
      color.green,
      color.green,
      color.green,
    ],
    'pass-fail': [color.red, color.green],
    'second-national-language': [color.red, color.green, color.green, color.green],
    thesis: [chartColor.blue],
  }

  const primaryDistributionOptions = getGradeGraphOptions(
    colors[seriesType],
    maxGradeValue,
    isRelative,
    statYears,
    title
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
        <span className="totalsDisclaimer">* Years with 5 students or fewer are shown as 0 in the chart</span>
      )}
    </div>
  )
}
