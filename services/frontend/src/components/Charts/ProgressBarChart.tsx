import ReactECharts from 'echarts-for-react'
import { useEffect, useMemo, useState } from 'react'

import { Section } from '@/components/Section'
import { generateGradientColors } from '@/util/color'

const getNumericValue = (value: unknown) => {
  const numericValue = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numericValue) ? numericValue : 0
}

const formatPercentage = (value: number) => `${value.toFixed(1)}%`

type ProgressData = {
  id: string
  stats: {
    data: number[]
    name: string
  }[]
  years: string[]
}

export const ProgressBarChart = ({ cypress, data }: { cypress: string; data: ProgressData }) => {
  const [legendSelection, setLegendSelection] = useState<Record<string, boolean>>({})
  const stats = data.stats ?? []
  const seriesNamesKey = stats.map(stat => stat.name).join('|')

  useEffect(() => {
    setLegendSelection({})
  }, [data.id, seriesNamesKey])

  const seriesCount = stats.length
  const gradientColors = seriesCount > 1 ? generateGradientColors(seriesCount - 1) : []
  const colors = [...gradientColors, '#ddd']

  const pointCount = Math.max(data.years?.length ?? 0, ...stats.map(series => series.data.length))
  const categories = Array.from({ length: pointCount }, (_, index) => data.years?.[index] ?? '')

  const isSeriesVisible = (name: string) => legendSelection[name] !== false

  const totals = Array.from({ length: pointCount }, (_, index) =>
    stats.reduce((sum, currentSeries) => {
      if (!isSeriesVisible(currentSeries.name)) {
        return sum
      }

      return sum + getNumericValue(currentSeries.data[index])
    }, 0)
  )

  const series = stats.map((graphSeries, index) => ({
    name: graphSeries.name,
    type: 'bar',
    stack: 'total',
    itemStyle: {
      color: colors[index],
    },
    label: {
      show: true,
      position: 'inside',
      formatter: (params: { data?: { percentage?: number } }) => {
        const percentage = getNumericValue(params.data?.percentage)

        return formatPercentage(percentage)
      },
    },
    labelLayout: {
      hideOverlap: true,
    },
    emphasis: {
      focus: 'series',
    },
    data: Array.from({ length: pointCount }, (_, pointIndex) => {
      const rawValue = getNumericValue(graphSeries.data[pointIndex])
      const total = totals[pointIndex]
      const percentage = isSeriesVisible(graphSeries.name) && total ? (rawValue / total) * 100 : 0

      return {
        value: percentage,
        rawValue,
        percentage,
      }
    }),
  }))

  const onEvents = useMemo(
    () => ({
      legendselectchanged: (params: { selected?: Record<string, boolean> }) => {
        if (!params.selected) {
          return
        }

        setLegendSelection(params.selected)
      },
    }),
    []
  )

  const option = {
    legend: {
      type: 'plain',
      selected: Object.keys(legendSelection).length ? legendSelection : undefined,
    },
    tooltip: {
      trigger: 'item',
      formatter: (params: { data?: { rawValue?: number; percentage?: number }; seriesName?: string }) => {
        const rawValue = getNumericValue(params.data?.rawValue)
        const percentage = getNumericValue(params.data?.percentage)

        return `<b>${params.seriesName ?? ''}: ${rawValue}</b><br/>${formatPercentage(percentage)}`
      },
    },
    toolbox: {
      top: -10,
      feature: {
        saveAsImage: {
          name: `oodikone_progress_of_students_in_${data.id}_by_starting_year`,
        },
      },
    },
    grid: {
      left: 10,
      top: 48,
      right: 10,
    },
    xAxis: {
      type: 'category',
      data: categories,
      z: 10,
    },
    yAxis: {
      type: 'value',
      inverse: true,
      min: 0,
      max: 100,
      axisLabel: {
        formatter: '{value}%',
      },
    },
    series,
  }

  return (
    <Section cypress={`${cypress}-progress-bar-chart`}>
      <ReactECharts notMerge onEvents={onEvents} option={option} opts={{ renderer: 'svg' }} style={{ height: 500 }} />
    </Section>
  )
}
