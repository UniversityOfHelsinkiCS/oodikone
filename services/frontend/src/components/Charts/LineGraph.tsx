import ReactECharts from 'echarts-for-react'

import { Section } from '@/components/Section'
import { theme } from '@/theme'
import { GraphStat } from '@/types/graphStat'

export const LineGraph = ({
  cypress,
  exportFileName,
  graphStats,
  years,
}: {
  cypress: string
  exportFileName: string
  graphStats: GraphStat[]
  years: number[]
}) => {
  if (!graphStats) {
    return null
  }

  const series = graphStats.map((graphStat, index) => {
    const color = theme.palette.graphColors[index % theme.palette.graphColors.length]

    return {
      ...graphStat,
      type: 'line',
      showSymbol: true,
      symbol: 'circle',
      symbolSize: 7,
      itemStyle: {
        color,
      },
      lineStyle: {
        color,
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
      trigger: 'axis',
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
    <Section cypress={`${cypress}-line-graph`}>
      <ReactECharts option={option} opts={{ renderer: 'svg' }} style={{ height: 450 }} />
    </Section>
  )
}
