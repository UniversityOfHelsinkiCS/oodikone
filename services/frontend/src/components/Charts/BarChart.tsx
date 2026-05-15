import ReactECharts from 'echarts-for-react'

import { Section } from '@/components/Section'
import { GraphStat } from '@/types/graphStat'

const colors = ['#003E65', '#1392c2', '#036415']

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

export const BarChart = ({ id, graphStats, years }: { id: string; graphStats: GraphStat[]; years: number[] }) => {
  if (!graphStats || !id || !years) {
    return null
  }

  const series = graphStats.map((graphSeries, index) => ({
    ...graphSeries,
    type: 'bar',
    itemStyle: {
      color: colors[index % colors.length],
    },
    label: {
      show: true,
      position: 'top',
      distance: 8,
      formatter: (params: { value?: unknown }) => formatNumber(params.value),
    },
    labelLayout: {
      hideOverlap: true,
    },
    emphasis: {
      focus: 'series',
    },
  }))

  const option = {
    legend: {},
    tooltip: {
      trigger: 'item',
    },
    toolbox: {
      feature: {
        saveAsImage: {
          name: `oodikone_graduations_and_thesis_of_degree_programme_${id}`,
        },
      },
    },
    grid: {
      top: 10,
      left: 10,
      right: 10,
    },
    xAxis: {
      type: 'category',
      data: years.map(String),
    },
    yAxis: {
      type: 'value',
      min: 0,
      minInterval: 1,
    },
    series,
  }

  return (
    <Section cypress="graduated-and-thesis-writers-of-the-programme-bar-chart">
      <ReactECharts option={option} opts={{ renderer: 'svg' }} style={{ height: 450, width: '100%' }} />
    </Section>
  )
}
