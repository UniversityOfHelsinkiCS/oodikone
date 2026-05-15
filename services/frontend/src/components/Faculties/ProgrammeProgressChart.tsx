import Typography from '@mui/material/Typography'
import ReactECharts from 'echarts-for-react'
import { useEffect, useMemo, useState } from 'react'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { generateGradientColors } from '@/util/color'
import { NameWithCode } from '@oodikone/shared/types'

export const ProgrammeProgressChart = ({
  data,
  labels,
  longLabels,
  names,
}: {
  data: number[][]
  labels: string[]
  longLabels: Record<string, NameWithCode>
  names: string[]
}) => {
  const { getTextIn } = useLanguage()
  const [legendSelection, setLegendSelection] = useState<Record<string, boolean>>({})
  const labelsKey = labels.join('|')
  const seriesNamesKey = names.join('|')

  useEffect(() => {
    setLegendSelection({})
  }, [labelsKey, seriesNamesKey])

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

  if (!data || data.length === 0) {
    return <Typography variant="caption">No data available for this year</Typography>
  }

  const getNumericValue = (value: unknown) => {
    const numericValue = typeof value === 'number' ? value : Number(value)
    return Number.isFinite(numericValue) ? numericValue : 0
  }

  const transpose = (matrix: number[][]): number[][] => {
    return matrix.reduce<number[][]>((prev, next) => next.map((_, i) => (prev[i] || []).concat(next[i])), [])
  }

  const colors = generateGradientColors(data[0]?.length || 6)
  const dataTranspose = transpose(data).map((obj, index) => ({
    name: names[index],
    data: obj,
  }))

  const isSeriesVisible = (name: string) => legendSelection[name] !== false

  const totals = labels.map((_, index) =>
    dataTranspose.reduce((sum, series) => {
      if (!isSeriesVisible(series.name)) {
        return sum
      }

      return sum + getNumericValue(series.data[index])
    }, 0)
  )

  const series = dataTranspose.map((seriesItem, index) => ({
    name: seriesItem.name,
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
        return percentage > 3 ? `${percentage.toFixed(1)}%` : ''
      },
    },
    labelLayout: {
      hideOverlap: true,
    },
    emphasis: {
      focus: 'none',
    },
    data: labels.map((_, dataIndex) => {
      const rawValue = getNumericValue(seriesItem.data[dataIndex])
      const total = totals[dataIndex]
      const percentage = total ? (rawValue / total) * 100 : 0

      return {
        value: percentage,
        rawValue,
        percentage,
      }
    }),
  }))

  const option = {
    legend: {
      borderColor: '#CCC',
      borderWidth: 1,
      bottom: 0,
      selected: Object.keys(legendSelection).length ? legendSelection : undefined,
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      backgroundColor: 'white',
      formatter: (
        params: Array<{ name?: string; seriesName?: string; color?: string; data?: { rawValue?: number } }>
      ) => {
        const tooltipParams = Array.isArray(params) ? params : [params]
        const label = tooltipParams[0]?.name ?? ''
        const title = getTextIn(longLabels[label]) ?? ''
        let tooltipString = `<b>${title}</b><br /><p>${label}</p><br />`

        tooltipParams.forEach(point => {
          const rawValue = getNumericValue(point.data?.rawValue)
          tooltipString += `<span style="color:${point.color}">●</span> ${point.seriesName}: <b>${rawValue}</b><br />`
        })

        return tooltipString
      },
    },
    toolbox: {
      feature: {
        saveAsImage: {
          name: 'Oodikone-progress-of-students',
        },
      },
    },
    grid: {
      top: 50,
      left: 10,
      right: 20,
      bottom: 50,
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLabel: {
        formatter: '{value}%',
      },
    },
    yAxis: {
      type: 'category',
      data: labels,
      inverse: true,
      z: 10,
    },
    series,
  }

  return (
    <ReactECharts
      notMerge
      onEvents={onEvents}
      option={option}
      opts={{ renderer: 'svg' }}
      style={{ height: 80 + 45 * labels.length, width: '100%' }}
    />
  )
}
