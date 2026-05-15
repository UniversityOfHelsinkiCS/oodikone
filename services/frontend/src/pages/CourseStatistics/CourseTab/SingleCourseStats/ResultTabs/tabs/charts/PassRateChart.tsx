import useTheme from '@mui/material/styles/useTheme'

import ReactECharts from 'echarts-for-react'

import { TotalsDisclaimer } from '@/components/common/TotalsDisclaimer'
import { FormattedStats, ProgrammeStats, ViewMode } from '@/types/courseStat'
import { absoluteToRelative, getDataObject } from './util'

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

const getPassRateSeries = (stats: FormattedStats[], viewMode: ViewMode) => {
  const all: number[] = []
  const passed: number[] = []
  const failed: number[] = []
  const enrolledNoGrade: number[] = []

  if (viewMode === 'ATTEMPTS') {
    stats.forEach(year => {
      const { passed: p, failed: f } = year.attempts.categories
      const { totalEnrollments } = year.attempts
      const enrolledWithNoGrade = totalEnrollments && totalEnrollments > 0 ? Math.max(0, totalEnrollments - p - f) : 0
      all.push(totalEnrollments ?? p + f)
      passed.push(p)
      failed.push(f)
      enrolledNoGrade.push(enrolledWithNoGrade)
    })
  } else {
    stats.forEach(year => {
      all.push(year.students.total || 0)
      passed.push(year.students.totalPassed || 0)
      failed.push(year.students.totalFailed || 0)
      enrolledNoGrade.push(year.students.enrolledStudentsWithNoGrade ?? 0)
    })
  }

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

export const PassRateChart = ({
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
  const colorsRelative = [gradeColors.pass, gradeColors.fail, gradeColors.enrolledNoGrade]
  const colors = [gradeColors.all, ...colorsRelative]

  const stats = data.stats.filter(stat => stat.name !== 'Total')
  const statYears = stats.map(year => year.name)

  const series = getPassRateSeries(stats, viewMode)
  const chartSeries = isRelative ? series.relative : series.absolute
  const chartColors = isRelative ? colorsRelative : colors
  const yAxisTitle = isRelative ? `Share of ${viewMode.toLowerCase()}` : `Number of ${viewMode.toLowerCase()}`

  const option = {
    color: chartColors,
    title: {
      text: `Pass rate for group ${data.name}`,
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
      max: isRelative ? 100 : undefined,
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
        borderRadius: 0,
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
