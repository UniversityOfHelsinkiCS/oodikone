import { useTheme } from '@mui/material'
import accessibility from 'highcharts/modules/accessibility'
import exportData from 'highcharts/modules/export-data'
import exporting from 'highcharts/modules/exporting'
import ReactHighcharts from 'react-highcharts'

import { TotalsDisclaimer } from '@/components/material/TotalsDisclaimer'
import { ProgrammeStats } from '@/types/courseStat'
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

export const GradeDistributionChart = ({
  data,
  isRelative,
  userHasAccessToAllStats,
  viewMode,
}: {
  data: ProgrammeStats
  isRelative: boolean
  userHasAccessToAllStats: boolean
  viewMode: 'ATTEMPTS' | 'STUDENTS'
}) => {
  const stats = data.stats.filter(stat => stat.name !== 'Total' || isRelative)

  const statYears = stats.map(year => year.name)
  const grades = stats.map(year => getGrades(year.students))

  const gradeGraphSeries = getGradeSeries(grades)
  const seriesType = getSeriesType(grades)

  const maxGradeValue = isRelative ? 100 : getMaxValueOfSeries(gradeGraphSeries.absolute)

  const theme = useTheme()
  const gradeColors = theme.palette.grades
  const colors = {
    other: [
      gradeColors.fail,
      gradeColors.generic,
      gradeColors.generic,
      gradeColors.generic,
      gradeColors.generic,
      gradeColors.generic,
      gradeColors.pass,
      gradeColors.pass,
      gradeColors.pass,
    ],
    'pass-fail': [gradeColors.fail, gradeColors.pass],
    'second-national-language': [gradeColors.fail, gradeColors.pass, gradeColors.pass, gradeColors.pass],
    thesis: [gradeColors.generic],
  }

  const primaryGraphOptions = getGraphOptions(
    colors[seriesType],
    colors[seriesType],
    isRelative,
    maxGradeValue,
    viewMode.toLowerCase() as 'attempts' | 'students',
    statYears,
    `Grades for group ${data.name}`
  )

  return (
    <div>
      <ReactHighcharts
        config={{
          ...primaryGraphOptions,
          series: isRelative ? gradeGraphSeries.relative : gradeGraphSeries.absolute,
        }}
      />
      <TotalsDisclaimer shownAsZero userHasAccessToAllStats={userHasAccessToAllStats} />
    </div>
  )
}
