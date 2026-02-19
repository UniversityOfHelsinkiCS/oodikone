import accessibility from 'highcharts/modules/accessibility'
import exportData from 'highcharts/modules/export-data'
import exporting from 'highcharts/modules/exporting'
import ReactHighcharts from 'react-highcharts'

import { Section } from '@/components/Section'
import { theme } from '@/theme'
import { GraphStat } from '@/types/graphStat'

exporting(ReactHighcharts.Highcharts)
exportData(ReactHighcharts.Highcharts)
accessibility(ReactHighcharts.Highcharts)

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
    color: theme.palette.graphColors[index],
    type: 'line' as const,
  }))

  const config = {
    series: dataWithColors,
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
    <Section cypress={`${cypress}-line-graph`}>
      <ReactHighcharts config={config} />
    </Section>
  )
}
