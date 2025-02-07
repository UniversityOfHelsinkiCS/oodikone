import accessibility from 'highcharts/modules/accessibility'
import exportData from 'highcharts/modules/export-data'
import exporting from 'highcharts/modules/exporting'
import ReactHighcharts from 'react-highcharts'

import { generateGradientColors } from '@/common'

exporting(ReactHighcharts.Highcharts)
exportData(ReactHighcharts.Highcharts)
accessibility(ReactHighcharts.Highcharts)

interface BarChartProps {
  data: {
    creditGraphStats: Record<string, { name: string; data: number[] }[]>
    years: string[]
  }
  track: string
}

export const BarChart = ({ data, track }: BarChartProps) => {
  if (!data?.creditGraphStats?.[track]) {
    return null
  }

  const correctData = data.creditGraphStats[track]
  const colors = generateGradientColors(correctData.length)
  const dataWithColors = Object.values(correctData).map((series, index) => ({
    ...series,
    color: colors[index],
    type: 'column' as const,
  }))

  const config = {
    series: dataWithColors,
    xAxis: {
      categories: data?.years,
    },
    chart: {
      type: 'column',
      height: '450px',
    },
    plotOptions: {
      column: {
        stacking: 'percent' as const,
        dataLabels: {
          enabled: true,
          format: '{point.percentage:.1f}%',
        },
      },
    },
    exporting: {
      filename: `oodikone_progress_of_students_of_the_studyprogramme_${track}_by_starting_year`,
    },
    yAxis: {
      title: {
        text: '',
      },
    },
  }

  return <ReactHighcharts config={config} />
}
