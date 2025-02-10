import { useTheme } from '@mui/material'
import accessibility from 'highcharts/modules/accessibility'
import exportData from 'highcharts/modules/export-data'
import exporting from 'highcharts/modules/exporting'
import ReactHighcharts from 'react-highcharts'

import { TotalsDisclaimer } from '@/components/material/TotalsDisclaimer'
import { ProgrammeStats, ViewMode } from '@/types/courseStat'
import {
  absoluteToRelative,
  getDataObject,
  getGradeSpread,
  getGraphOptions,
  getMaxValueOfSeries,
  getSeriesType,
  getThesisGradeSpread,
} from '../util'

exporting(ReactHighcharts.Highcharts)
exportData(ReactHighcharts.Highcharts)
accessibility(ReactHighcharts.Highcharts)

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
        getDataObject('A', newSeries.A.map(absoluteToRelative(sumAll)), 'a'),
        getDataObject('NSLA', newSeries.NSLA.map(absoluteToRelative(sumAll)), 'a'),
        getDataObject('LUB', newSeries.LUB.map(absoluteToRelative(sumAll)), 'a'),
        getDataObject('CL', newSeries.CL.map(absoluteToRelative(sumAll)), 'a'),
        getDataObject('MCLA', newSeries.MCLA.map(absoluteToRelative(sumAll)), 'a'),
        getDataObject('ECLA', newSeries.ECLA.map(absoluteToRelative(sumAll)), 'a'),
        getDataObject('L', newSeries.L.map(absoluteToRelative(sumAll)), 'a'),
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
        getDataObject('TT', newSeries.TT.map(absoluteToRelative(sumAll)), 'a'),
        getDataObject('HT', newSeries.HT.map(absoluteToRelative(sumAll)), 'a'),
        getDataObject('Hyv.', newSeries['Hyv.'].map(absoluteToRelative(sumAll)), 'a'),
      ],
    }
  }

  if (seriesType === 'pass-fail') {
    return {
      absolute: [getDataObject('0', newSeries[0], 'a'), getDataObject('Hyv.', newSeries['Hyv.'], 'b')],
      relative: [
        getDataObject('0', newSeries[0].map(absoluteToRelative(sumAll)), 'a'),
        getDataObject('Hyv.', newSeries['Hyv.'].map(absoluteToRelative(sumAll)), 'a'),
      ],
    }
  }

  return {
    absolute: [
      getDataObject('0', newSeries[0], 'a'),
      getDataObject('TT', newSeries.TT, 'b'),
      getDataObject('HT', newSeries.HT, 'b'),
      getDataObject('Hyv.', newSeries['Hyv.'], 'b'),
      getDataObject('1', newSeries[1], 'c'),
      getDataObject('2', newSeries[2], 'd'),
      getDataObject('3', newSeries[3], 'e'),
      getDataObject('4', newSeries[4], 'f'),
      getDataObject('5', newSeries[5], 'g'),
    ],
    relative: [
      getDataObject('0', newSeries[0].map(absoluteToRelative(sumAll)), 'a'),
      getDataObject('TT', newSeries.TT.map(absoluteToRelative(sumAll)), 'a'),
      getDataObject('HT', newSeries.HT.map(absoluteToRelative(sumAll)), 'a'),
      getDataObject('Hyv.', newSeries['Hyv.'].map(absoluteToRelative(sumAll)), 'a'),
      getDataObject('1', newSeries[1].map(absoluteToRelative(sumAll)), 'a'),
      getDataObject('2', newSeries[2].map(absoluteToRelative(sumAll)), 'a'),
      getDataObject('3', newSeries[3].map(absoluteToRelative(sumAll)), 'a'),
      getDataObject('4', newSeries[4].map(absoluteToRelative(sumAll)), 'a'),
      getDataObject('5', newSeries[5].map(absoluteToRelative(sumAll)), 'a'),
    ],
  }
}

const getGrades = students => {
  const grades = { ...students.grades }
  const enrolledWithNoGrade = students.enrolledStudentsWithNoGrade || 0
  grades[0] = (grades[0] || 0) + enrolledWithNoGrade
  return grades
}

export const GradeDistributionChart = ({
  data,
  isRelative,
  userHasAccessToAllStats,
  viewMode,
}: {
  data: ProgrammeStats
  isRelative: boolean
  userHasAccessToAllStats: boolean
  viewMode: ViewMode
}) => {
  const theme = useTheme()
  const gradeColors = theme.palette.grades
  const colors = {
    other: [
      gradeColors.fail,
      gradeColors.tt,
      gradeColors.ht,
      gradeColors.pass,
      gradeColors.grade1,
      gradeColors.grade2,
      gradeColors.grade3,
      gradeColors.grade4,
      gradeColors.grade5,
    ],
    'pass-fail': [gradeColors.fail, gradeColors.pass],
    'second-national-language': [gradeColors.fail, gradeColors.tt, gradeColors.ht, gradeColors.pass],
    thesis: [
      gradeColors.i,
      gradeColors.a,
      gradeColors.nsla,
      gradeColors.lub,
      gradeColors.cl,
      gradeColors.mcla,
      gradeColors.ecla,
      gradeColors.l,
    ],
  }

  const stats = data.stats.filter(stat => stat.name !== 'Total' || isRelative)
  const statYears = stats.map(year => year.name)

  const grades = stats.map(year => getGrades(year.students))

  const series = getGradeSeries(grades)
  const seriesType = getSeriesType(grades)
  const maxGradeValue = isRelative ? 100 : getMaxValueOfSeries(series.absolute)

  const graphOptions = getGraphOptions(
    colors[seriesType],
    colors[seriesType],
    isRelative,
    maxGradeValue,
    statYears,
    `Grades for group ${data.name}`,
    viewMode
  )

  return (
    <div>
      <ReactHighcharts config={{ ...graphOptions, series: isRelative ? series.relative : series.absolute }} />
      <TotalsDisclaimer shownAsZero userHasAccessToAllStats={userHasAccessToAllStats} />
    </div>
  )
}
