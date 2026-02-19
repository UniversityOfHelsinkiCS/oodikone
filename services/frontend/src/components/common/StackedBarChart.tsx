/* eslint-disable react/no-this-in-sfc */
import HighCharts from 'highcharts' // eslint-disable-line import-x/default
import accessibility from 'highcharts/modules/accessibility'
import exportData from 'highcharts/modules/export-data'
import exporting from 'highcharts/modules/exporting'
import ReactHighcharts from 'react-highcharts'

import { Section } from '@/components/Section'
import { theme } from '@/theme'

exporting(ReactHighcharts.Highcharts)
exportData(ReactHighcharts.Highcharts)
accessibility(ReactHighcharts.Highcharts)

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

  const dataWithColors = data?.map((series, index) => ({
    ...series,
    color: theme.palette.graphColors[index],
    type: 'column' as const,
  }))

  const config: HighCharts.Options = {
    series: dataWithColors,
    xAxis: {
      categories: labels,
      allowDecimals: false,
    },
    chart: {
      type: 'column',
      height: '450px',
    },
    exporting: {
      filename: exportFileName,
    },
    plotOptions: {
      column: {
        stacking: 'normal',
        dataLabels: {
          enabled: true,
          formatter() {
            if (Number.isInteger(this.y)) return `${this.y}`
            return `${this.y?.toFixed(1)}`
          },
        },
      },
    },
    tooltip: {
      pointFormat: '<b>{series.name}: {point.percentage:.1f} %</b>',
    },
    yAxis: {
      allowDecimals: false,
      min: 0,
      reversed: false,
      title: {
        text: '',
      },
    },
  }

  return (
    <Section cypress={`${cypress}-stacked-bar-chart`}>
      <ReactHighcharts config={config} />
    </Section>
  )
}
