import useTheme from '@mui/material/styles/useTheme'

import ReactECharts from 'echarts-for-react'

import { TotalsDisclaimer } from '@/components/common/TotalsDisclaimer'
import {
  absoluteToRelative,
  getDataObject,
  getMaxValueOfSeries,
} from '@/pages/CourseStatistics/CourseTab/SingleCourseStats/ResultTabs/tabs/charts/util'
import {
  getGradeSpread,
  getSeriesType,
  getThesisGradeSpread,
} from '@/pages/CourseStatistics/CourseTab/SingleCourseStats/ResultTabs/tabs/util'
import { ProgrammeStats, ViewMode } from '@/types/courseStat'

const formatNumber = (value: unknown) => {
  const numericValue = typeof value === 'number' ? value : Number(value)

  if (!Number.isFinite(numericValue)) {
    return ''
  }

  if (Number.isInteger(numericValue)) {
    return `${numericValue}`
  }

  return `${numericValue.toFixed(2)}`
}

const getNumericValue = (value: unknown) => {
  const numericValue = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numericValue) ? numericValue : 0
}

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

  const chartSeries = isRelative ? series.relative : series.absolute
  const chartColors = colors[seriesType]
  const yAxisTitle = isRelative ? `Share of ${viewMode.toLowerCase()}` : `Number of ${viewMode.toLowerCase()}`

  const option = {
    color: chartColors,
    title: {
      text: `Grades for group ${data.name}`,
      left: 'center',
    },
    toolbox: {
      feature: {
        dataView: {
          readOnly: true,
        },
      },
    },
    tooltip: {
      trigger: 'item',
      formatter: (params: { seriesName?: string; value?: unknown; dataIndex?: number; name?: string }) => {
        const value = getNumericValue(params.value)
        const category = params.name ?? ''
        const categoryLine = category ? `<b>${category}</b><br/>` : ''

        if (isRelative) {
          const dataIndex = params.dataIndex ?? 0
          const total = chartSeries.reduce((sum, seriesItem) => sum + getNumericValue(seriesItem.data[dataIndex]), 0)
          const percentage = total ? (value / total) * 100 : 0
          return `${categoryLine}<b>${params.seriesName ?? ''}</b>: ${formatNumber(percentage)}%`
        }

        return `${categoryLine}<b>${params.seriesName ?? ''}</b>: ${formatNumber(value)}`
      },
    },
    legend: {
      bottom: 0,
    },
    grid: {
      top: 60,
      left: 10,
      right: 10,
      bottom: 60,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: statYears,
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: isRelative ? 100 : maxGradeValue,
      minInterval: 1,
      name: yAxisTitle,
      axisLabel: {
        margin: 50,
        formatter: isRelative ? '{value}%' : '{value}',
      },
    },
    series: chartSeries.map((seriesItem, index) => ({
      name: seriesItem.name,
      type: 'bar',
      stack: seriesItem.stack,
      data: seriesItem.data,
      itemStyle: {
        borderRadius: 1,
        color: chartColors[index],
      },
      emphasis: {
        focus: 'series',
      },
    })),
  }

  return (
    <div>
      <ReactECharts notMerge option={option} opts={{ renderer: 'svg' }} style={{ height: 450 }} />
      <TotalsDisclaimer shownAsZero userHasAccessToAllStats={userHasAccessToAllStats} />
    </div>
  )
}
