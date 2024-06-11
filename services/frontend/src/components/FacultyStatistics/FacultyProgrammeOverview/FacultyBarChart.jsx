import accessibility from 'highcharts/modules/accessibility'
import exportData from 'highcharts/modules/export-data'
import exporting from 'highcharts/modules/exporting'
import ReactHighcharts from 'react-highcharts'

import { generateGradientColors } from '@/common'

exporting(ReactHighcharts.Highcharts)
exportData(ReactHighcharts.Highcharts)
accessibility(ReactHighcharts.Highcharts)

export const FacultyBarChart = ({ cypress, data }) => {
  if (!data.stats) return null

  const colors = generateGradientColors(Object.keys(data.stats).length)
  const dataWithColors = Object.values(data.stats).map((series, index) => ({ ...series, color: colors[index] }))

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
        stacking: 'percent',
        dataLabels: {
          enabled: true,
          format: '{point.percentage:.1f}%',
        },
      },
    },
    exporting: {
      filename: `oodikone_progress_of_students_in_${data?.id}_by_study_start_year`,
    },
    yAxis: {
      allowDecimals: false,
      min: 0,
      reversed: false,
      title: '',
    },
  }

  return (
    <div data-cy={`Graph-${cypress}`}>
      <ReactHighcharts config={config} />
    </div>
  )
}
