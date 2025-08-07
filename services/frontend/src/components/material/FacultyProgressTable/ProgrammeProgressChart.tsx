/* eslint-disable react/no-this-in-sfc */
import Typography from '@mui/material/Typography'

import HighCharts from 'highcharts' // eslint-disable-line import-x/default
import accessibility from 'highcharts/modules/accessibility'
import exportData from 'highcharts/modules/export-data'
import exporting from 'highcharts/modules/exporting'
import ReactHighcharts from 'react-highcharts'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { generateGradientColors } from '@/util/color'
import { NameWithCode } from '@oodikone/shared/types'

exporting(ReactHighcharts.Highcharts)
exportData(ReactHighcharts.Highcharts)
accessibility(ReactHighcharts.Highcharts)

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
  if (!data || data.length === 0) {
    return <Typography variant="caption">No data available for this year</Typography>
  }

  const transpose = (matrix: number[][]): number[][] => {
    return matrix.reduce<number[][]>((prev, next) => next.map((_, i) => (prev[i] || []).concat(next[i])), [])
  }

  const colors = generateGradientColors(data[0]?.length || 6)
  const dataTranspose: HighCharts.SeriesBarOptions[] = transpose(data).map((obj, index) => ({
    name: names[index],
    data: obj,
    color: colors[index],
    type: 'bar',
  }))

  const config: HighCharts.Options = {
    chart: {
      type: 'bar',
      marginTop: 60,
      height: 80 + 45 * labels.length,
    },
    series: dataTranspose,
    xAxis: {
      categories: labels,
    },
    yAxis: {
      min: 0,
      reversed: true,
      title: {
        text: '',
      },
    },
    legend: {
      borderColor: '#CCC',
      borderWidth: 1,
      verticalAlign: 'top',
    },
    tooltip: {
      shared: true,
      backgroundColor: 'white',
      formatter(this: any) {
        let tooltipString = `<b>${getTextIn(longLabels[this.x])}</b><br /><p>${this.x}</p><br />`
        this.points.forEach((point: any) => {
          tooltipString += `<span style="color:${point.color}">●</span> ${point.series.name}: <b>${point.y}</b><br />`
        })
        return tooltipString
      },
    },
    plotOptions: {
      series: {
        stacking: 'percent',
        dataLabels: {
          enabled: true,
          format: '{point.percentage:.1f}%',
          filter: {
            property: 'percentage',
            operator: '>',
            value: 3,
          },
        },
      },
    },
  }

  return <ReactHighcharts config={config} />
}
