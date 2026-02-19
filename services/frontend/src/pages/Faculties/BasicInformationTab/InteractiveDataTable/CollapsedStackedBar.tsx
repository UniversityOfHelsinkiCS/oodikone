/* eslint-disable react/no-this-in-sfc  */
/* eslint-disable-next-line import-x/default */
import HighCharts from 'highcharts'
import accessibility from 'highcharts/modules/accessibility'
import exportData from 'highcharts/modules/export-data'
import exporting from 'highcharts/modules/exporting'
import ReactHighcharts from 'react-highcharts'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { theme } from '@/theme'
import { NameWithCode } from '@oodikone/shared/types'

exporting(ReactHighcharts.Highcharts)
exportData(ReactHighcharts.Highcharts)
accessibility(ReactHighcharts.Highcharts)

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
  if (names[0] === 'Started studying') {
    names[0] += ' (new in faculty)'
  }
  const dataTranspose = transpose(data)
    .map((obj, index) => ({
      name: names[index],
      data: obj,
      color: theme.palette.graphColors[index],
      type: 'bar' as const,
    }))
    .reverse()

  const differenceArray: Record<string, Record<string, number>> = Object.keys(differenceData).reduce(
    (programmes, programme) => ({
      ...programmes,
      [programme]: differenceData[programme].reduce(
        (results, value, currentIndex) => ({
          ...results,
          [names[currentIndex]]: value,
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
        value: Number(value[0]) - 0.5,
        dashStyle: 'Solid' as const,
        label: {
          text: value[1],
          style: {
            color: 'black',
            fontWeight: 'bold',
            position: 'absolute',
          },
          align: 'right' as const,
          x: 0,
          y: 5,
        },
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

  const config: HighCharts.Options = {
    chart: {
      type: 'bar',
      marginTop: 60,
      height: getFlexHeight(labels.length),
    },
    series: dataTranspose,
    xAxis: {
      categories: labels,
      title: {
        text: '',
      },
      plotLines: chartPlotLinePlaces,
    },
    yAxis: {
      min: 0,
      title: {
        text: '',
      },
      stackLabels: {
        enabled: true,
      },
    },
    legend: {
      layout: 'horizontal',
      align: 'left',
      x: 20,
      verticalAlign: 'top',
      y: -10,
      floating: true,
      backgroundColor: 'white',
      borderColor: '#CCC',
      borderWidth: 1,
      shadow: false,
    },
    tooltip: {
      shared: true,
      backgroundColor: 'white',
      formatter() {
        let tooltipString = `<b>${getTextIn(longLabels[this.x!])}</b><br /><p>${this.x} - ${
          longLabels[this.x!]?.code
        }</p><br />`
        const diffArray = differenceArray[this.x!]
        this.points?.forEach(point => {
          tooltipString += `<span style="color:${point.color as string}">●</span> <b>${point.series.name}: ${point.y}</b>
          (<span style="color:${getColor(diffArray[point.series.name])};font-weight:bold">${getCorrectSign(
            diffArray[point.series.name]
          )}</span>)<br />`
        })
        tooltipString += `<b>Total: ${this.points?.reduce((prev, current) => prev + current.y!, 0)}</b>`
        return tooltipString
      },
    },
    plotOptions: {
      series: {
        stacking: 'normal',
        dataLabels: {
          enabled: true,
          align: 'left',
          formatter() {
            if (Number.isInteger(this.y)) return `${this.y}`
            return `${this.y?.toFixed(1)}`
          },
          filter: {
            property: 'y',
            operator: '>',
            value: 2,
          },
        },
      },
    },
  }

  if (!dataTranspose) {
    return <>No data provided</>
  }

  return <ReactHighcharts config={config} />
}
