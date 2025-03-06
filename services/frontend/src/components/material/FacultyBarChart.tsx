import { OptionsStackingValue, SeriesColumnOptions } from 'highcharts'
import accessibility from 'highcharts/modules/accessibility'
import exportData from 'highcharts/modules/export-data'
import exporting from 'highcharts/modules/exporting'
import ReactHighcharts from 'react-highcharts'

import { Section } from '@/components/material/Section'
import { generateGradientColors } from '@/util/color'

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
        stacking: 'percent' as OptionsStackingValue,
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
      title: {
        text: '',
      },
    },
  }

  return (
    <Section cypress={`${cypress}-bar-chart`}>
      <ReactHighcharts config={config} />
    </Section>
  )
}
