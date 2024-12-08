import { Paper } from '@mui/material'
import { OptionsStackingValue, SeriesColumnOptions } from 'highcharts'
import accessibility from 'highcharts/modules/accessibility'
import exportData from 'highcharts/modules/export-data'
import exporting from 'highcharts/modules/exporting'
import ReactHighcharts from 'react-highcharts'

import { generateGradientColors } from '@/common'

exporting(ReactHighcharts.Highcharts)
exportData(ReactHighcharts.Highcharts)
accessibility(ReactHighcharts.Highcharts)

export const FacultyBarChart = ({
  cypress,
  data,
}: {
  cypress: string
  data: {
    id: string
    stats: {
      data: number[]
      name: string
    }[]
    years: string[]
  }
}) => {
  if (!data.stats) {
    return null
  }

  const colors = generateGradientColors(Object.keys(data.stats).length)
  const dataWithColors: SeriesColumnOptions[] = Object.values(data.stats).map((series, index) => ({
    ...series,
    color: colors[index],
    type: 'column',
  }))

  const config = {
    title: {
      text: '',
    },
    series: dataWithColors,
    credits: {
      enabled: false,
    },
    xAxis: {
      categories: data?.years,
    },
    chart: {
      type: 'column',
      height: '450px',
    },
    plotOptions: {
      column: {
        stacking: 'percent' as OptionsStackingValue,
        dataLabels: {
          enabled: true,
          format: '{point.percentage:.1f}%',
        },
      },
      series: {
        animation: false,
      },
    },
    exporting: {
      filename: `oodikone_progress_of_students_in_${data?.id}_by_study_start_year`,
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
    <Paper data-cy={`${cypress}BarChart`} sx={{ padding: 2 }} variant="outlined">
      <ReactHighcharts config={config} />
    </Paper>
  )
}
