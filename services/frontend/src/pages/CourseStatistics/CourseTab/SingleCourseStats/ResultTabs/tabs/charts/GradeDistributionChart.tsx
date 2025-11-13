import useTheme from '@mui/material/styles/useTheme'

import accessibility from 'highcharts/modules/accessibility'
import exportData from 'highcharts/modules/export-data'
import exporting from 'highcharts/modules/exporting'
import ReactHighcharts from 'react-highcharts'

import { TotalsDisclaimer } from '@/components/common/TotalsDisclaimer'
import { ProgrammeStats, ViewMode } from '@/types/courseStat'
import { getGradeSpread, getSeriesType, getThesisGradeSpread } from '../util'
import { absoluteToRelative, getDataObject, getGraphOptions, getMaxValueOfSeries } from './util'

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
  const newSeries = seriesType === 'thesis' ? getThesisGradeSpread(series) : getGradeSpread(series)
  const sumAll = calculateSumAll(newSeries)

  const gradeCategories = {
    thesis: ['I', 'A', 'NSLA', 'LUB', 'CL', 'MCLA', 'ECLA', 'L'],
    'second-national-language': ['0', 'TT', 'HT', 'Hyv.'],
    'pass-fail': ['0', 'Hyv.'],
    other: ['0', 'TT', 'HT', 'Hyv.', '1', '2', '3', '4', '5'],
  }

  const categories = gradeCategories[seriesType] || gradeCategories.other

  const absolute = categories.map((grade, index) =>
    getDataObject(grade, newSeries[grade], String.fromCharCode(97 + index))
  )

  const relative = categories.map(grade => getDataObject(grade, newSeries[grade].map(absoluteToRelative(sumAll)), 'a'))

  return { absolute, relative }
}

const getGrades = students => {
  const grades = { ...students.grades }
  const enrolledWithNoGrade = students.enrolledStudentsWithNoGrade ?? 0
  grades[0] = (grades[0] ?? 0) + enrolledWithNoGrade
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
