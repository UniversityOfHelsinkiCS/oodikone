import accessibility from 'highcharts/modules/accessibility'
import exportData from 'highcharts/modules/export-data'
import exporting from 'highcharts/modules/exporting'
import ReactHighcharts from 'react-highcharts'

import { Section } from '@/components/material/Section'
import { GraphStat } from '@/shared/types/api/faculty'

exporting(ReactHighcharts.Highcharts)
exportData(ReactHighcharts.Highcharts)
accessibility(ReactHighcharts.Highcharts)

// TODO: Move to theme
const colors = ['#7cb5ec', '#90ed7d', '#434348', '#f7a35c', '#FFF000', '#2b908f', '#f45b5b', '#91e8e1']

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

  const dataWithColors = graphStats.map((series, index) => ({
    ...series,
    color: colors[index],
    type: 'line' as const,
  }))

  const config = {
    title: {
      text: '',
    },
    series: dataWithColors,
    credits: {
      enabled: false,
    },
    exporting: {
      filename: exportFileName,
    },
    chart: {
      height: '450px',
    },
    xAxis: {
      categories: years.map(String),
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
    <Section data-cy={`Graph-${cypress}`}>
      <ReactHighcharts config={config} />
    </Section>
  )
}
