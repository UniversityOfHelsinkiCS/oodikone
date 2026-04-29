import ReactECharts from 'echarts-for-react'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { theme } from '@/theme'
import { NameWithCode } from '@oodikone/shared/types'

export const CollapsedStackedBar = ({
  data,
  differenceData,
  labels,
  longLabels,
  names,
  plotLinePlaces,
}: {
  data: number[][]
  differenceData: Record<string, number[]>
  labels: string[]
  longLabels: Record<string, NameWithCode>
  names: string[]
  plotLinePlaces: string[][]
}) => {
  const { getTextIn } = useLanguage()

  const transpose = (matrix: number[][]) => {
    return matrix.reduce((prev, next) => next.map((_item, i) => (prev[i] || []).concat(next[i])), [] as number[][])
  }
  const seriesNames = names.map((name, index) =>
    index === 0 && name === 'Started studying' ? 'Started studying (new in faculty)' : name
  )
  const dataTranspose = transpose(data).map((obj, index) => ({
    name: seriesNames[index],
    data: obj,
    color: theme.palette.graphColors[index],
  }))

  const differenceArray: Record<string, Record<string, number>> = Object.keys(differenceData).reduce(
    (programmes, programme) => ({
      ...programmes,
      [programme]: differenceData[programme].reduce(
        (results, value, currentIndex) => ({
          ...results,
          [seriesNames[currentIndex]]: value,
        }),
        {}
      ),
    }),
    {}
  )

  const getCorrectSign = (change: number) => {
    if (change > 0) {
      return `+${change.toString()}`
    }
    return change
  }

  const chartPlotLinePlaces = plotLinePlaces
    ? plotLinePlaces.map(value => ({
        color: '#90A959',
        width: 1,
        value: Number(value[0]),
        label: value[1],
      }))
    : []

  // Point width is 24 px different multipliers adjusts the height.
  const getFlexHeight = (length: number) => {
    if (length > 7) return `${length * 24 * 1.5}px`
    if (length <= 2) return `${length * 24 * 6}px`
    if (length <= 4) return `${length * 24 * 3}px`
    return `${length * 24 * 2}px`
  }

  const getColor = (change: number) => {
    // TODO: Move to theme
    if (change > 0) return '#6ab04c'
    if (change < 0) return '#ff7979'
    return '#7B9FCF'
  }

  const formatNumber = (value: unknown) => {
    const numericValue = typeof value === 'number' ? value : Number(value)

    if (!Number.isFinite(numericValue)) return ''
    if (Number.isInteger(numericValue)) return `${numericValue}`
    return `${numericValue.toFixed(1)}`
  }

  const getNumericValue = (value: unknown) => {
    const numericValue = typeof value === 'number' ? value : Number(value)
    return Number.isFinite(numericValue) ? numericValue : 0
  }

  const totals = labels.map((_, index) =>
    dataTranspose.reduce((sum, series) => sum + getNumericValue(series.data[index]), 0)
  )

  // Prevents clutter
  const labelCutoff = Math.round(Math.max(...totals) * 0.05)

  const totalMarkPoints = labels.map((label, index) => ({
    coord: [totals[index], label],
    value: totals[index],
  }))

  const series = dataTranspose.map((graphSeries, index) => ({
    name: graphSeries.name,
    type: 'bar',
    stack: 'total',
    data: graphSeries.data,
    itemStyle: {
      color: graphSeries.color,
    },
    label: {
      show: true,
      position: 'insideLeft',
      formatter: (params: { value?: unknown }) => {
        const value = getNumericValue(params.value)
        if (value <= labelCutoff) return ''
        return formatNumber(value)
      },
    },
    labelLayout: {
      hideOverlap: true,
    },
    markPoint:
      index === dataTranspose.length - 1
        ? {
            showSymbol: false,
            symbolSize: 0,
            label: {
              show: true,
              position: 'right',
              distance: 10,
              formatter: (params: { value?: unknown }) => `(${formatNumber(params.value)})`,
            },
            data: totalMarkPoints,
          }
        : undefined,
  }))

  const plotLineSeries = chartPlotLinePlaces.length
    ? [
        {
          name: 'Plot lines',
          type: 'line',
          data: [],
          silent: true,
          tooltip: { show: false },
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: {
              color: '#000',
              width: 1,
            },
            data: chartPlotLinePlaces.map(place => ({
              yAxis: place.value,
              lineStyle: {
                width: 0,
              },
              label: {
                show: true,
                formatter: place.label,
                position: 'insideEnd',
                color: '#000',
                fontWeight: 'bold',
                distance: 5,
              },
            })),
          },
        },
      ]
    : []

  const option = {
    grid: {
      top: 20,
      left: 10,
      right: 10,
      bottom: 75,
      show: true,
    },
    legend: {
      type: 'scroll',
      borderWidth: 0,
      data: series.map(item => item.name),
    },
    tooltip: {
      confine: true,
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      backgroundColor: '#fff',
      borderColor: '#CCC',
      borderWidth: 1,
      formatter: (rawParams: unknown) => {
        const params = Array.isArray(rawParams) ? rawParams : [rawParams]
        const barParams = params.filter(
          param =>
            (param as { seriesType?: string })?.seriesType === 'bar' &&
            (param as { componentType?: string })?.componentType === 'series'
        ) as Array<{ dataIndex?: number; seriesName?: string; value?: unknown; color?: string }>

        const firstPoint = barParams[0]
        if (!firstPoint) return ''

        const dataIndex = firstPoint.dataIndex ?? 0
        const label = labels[dataIndex] ?? ''
        const labelInfo = longLabels[label]
        let tooltipString = `<b>${getTextIn(labelInfo) ?? ''}</b><p>${label} - ${labelInfo?.code ?? ''}</p>`
        const diffArray = differenceArray[label] ?? {}

        barParams.forEach(point => {
          const value = getNumericValue(point.value)
          const seriesName = point.seriesName ?? ''
          const diffValue = diffArray[seriesName]
          tooltipString += `<span style="color:${point.color ?? '#000'}">●</span> <b>${seriesName}: ${formatNumber(
            value
          )}</b>`
          if (typeof diffValue === 'number') {
            tooltipString += ` (<span style="color:${getColor(diffValue)};font-weight:bold">${getCorrectSign(
              diffValue
            )}</span>)`
          }
          tooltipString += '<br />'
        })
        const total = barParams.reduce((sum, current) => sum + getNumericValue(current.value), 0)

        tooltipString += `<b>Total: ${formatNumber(total)}</b>`
        return tooltipString
      },
    },

    xAxis: {
      type: 'value',
      axisLine: { show: true },
      axisTick: { show: false },
      min: 0,
    },
    yAxis: {
      type: 'category',
      data: labels,
      inverse: true,
      axisLine: {
        show: true,
      },
    },
    series: [...series, ...plotLineSeries],
  }

  if (!dataTranspose) {
    return <>No data provided</>
  }

  return <ReactECharts option={option} opts={{ renderer: 'canvas' }} style={{ height: getFlexHeight(labels.length) }} />
}
