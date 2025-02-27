import accessibility from 'highcharts/modules/accessibility'
import exportData from 'highcharts/modules/export-data'
import exporting from 'highcharts/modules/exporting'
import ReactHighcharts from 'react-highcharts'

import { Section } from '@/components/material/Section'
import { GraphStat } from '@/types/graphStat'

exporting(ReactHighcharts.Highcharts)
exportData(ReactHighcharts.Highcharts)
accessibility(ReactHighcharts.Highcharts)

// TODO: Move to theme
const colors = ['#003E65', '#1392c2', '#036415']

export const BarChart = ({ id, graphStats, years }: { id: string; graphStats: GraphStat[]; years: number[] }) => {
  if (!graphStats || !id || !years) {
    return null
  }

  const dataWithColors = graphStats.map((series, index) => ({
    ...series,
    color: colors[index],
    type: 'column' as const,
  }))

  const config: Highcharts.Options = {
    series: dataWithColors,
    xAxis: {
      categories: years.map(year => year.toString()),
    },
    chart: {
      type: 'column' as const,
      height: '450px',
    },
    exporting: {
      filename: `oodikone_graduations_and_thesis_of_study_programme_${id}`,
    },
    plotOptions: {
      column: {
        dataLabels: {
          enabled: true,
        },
      },
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
    <Section cypress="graduated-and-thesis-writers-of-the-programme-bar-chart">
      <ReactHighcharts config={config} />
    </Section>
  )
}
