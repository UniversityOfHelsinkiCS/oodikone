import ReactECharts from 'echarts-for-react'

import { Section } from '@/components/Section'
import { theme } from '@/theme'

const formatNumber = (value: unknown) => {
  const numericValue = typeof value === 'number' ? value : Number(value)

  if (!Number.isFinite(numericValue)) {
    return ''
  }

  if (Number.isInteger(numericValue)) {
    return `${numericValue}`
  }

  return `${numericValue.toFixed(1)}`
}

const getNumericValue = (value: unknown) => {
  const numericValue = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numericValue) ? numericValue : 0
}

export const StackedBarChart = ({
  cypress,
  data,
  labels,
  exportFileName = 'chart',
}: {
  cypress: string
  data?: { data: number[]; name: string }[]
  labels?: string[]
  exportFileName: string
}) => {
  if (!data) {
    return null
  }

  const series = data.map((graphSeries, index) => {
    const color = theme.palette.graphColors[index % theme.palette.graphColors.length]

    return {
      ...graphSeries,
      type: 'bar',
      stack: 'total',
      itemStyle: {
        color,
      },
      label: {
        show: true,
        formatter: (params: { value?: unknown }) => formatNumber(params.value),
      },
      labelLayout: {
        hideOverlap: true,
      },
      emphasis: {
        focus: 'series',
      },
    }
  })

  const option = {
    legend: {
      type: 'scroll',
    },
    tooltip: {
      trigger: 'item',
      formatter: (params: { seriesName?: string; value?: unknown; dataIndex?: number }) => {
        const dataIndex = params.dataIndex ?? 0
        const value = getNumericValue(params.value)

        const total = data.reduce((sum, currentSeries) => sum + getNumericValue(currentSeries.data[dataIndex]), 0)
        const percentage = total ? ((value / total) * 100).toFixed(1) : '0.0'

        return `<b>${params.seriesName ?? ''}: ${percentage} %</b>`
      },
    },
    toolbox: {
      feature: {
        saveAsImage: {
          name: exportFileName,
        },
      },
    },
    grid: {
      left: 10,
      top: 10,
      right: 10,
    },
    xAxis: {
      type: 'category',
      data: labels,
    },
    yAxis: {
      type: 'value',
      min: 0,
      minInterval: 1,
    },
    series,
  }

  return (
    <Section cypress={`${cypress}-stacked-bar-chart`}>
      <ReactECharts option={option} opts={{ renderer: 'svg' }} style={{ height: 450 }} />
    </Section>
  )
}
