import accessibility from 'highcharts/modules/accessibility'
import exportData from 'highcharts/modules/export-data'
import exporting from 'highcharts/modules/exporting'
import ReactHighcharts from 'react-highcharts'

import { generateGradientColors } from '@/common'
import { NoDataMessage } from '@/components/StudyProgramme/NoDataMessage'

exporting(ReactHighcharts.Highcharts)
exportData(ReactHighcharts.Highcharts)
accessibility(ReactHighcharts.Highcharts)

export const BarChart = ({ cypress, data, track }) => {
  if (!data || !data.creditGraphStats || !data.creditGraphStats[track])
    return <NoDataMessage message="No progress data for the studytrack found. Try with another studytrack" />
  const correctData = data.creditGraphStats[track]
  const colors = generateGradientColors(correctData.length)
  const dataWithColors = Object.values(correctData).map((series, index) => ({ ...series, color: colors[index] }))

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
      filename:
        track === '' || track === 'studyprogramme'
          ? `oodikone_progress_of_students_in_${data?.id}_by_study_start_year`
          : `oodikone_progress_of_students_in_${data?.id}_${track}_by_study_start_year`,
    },
    yAxis: {
      allowDecimals: false,
      min: 0,
      reversed: false,
      title: '',
    },
  }

  return (
    <div className="graph-container" data-cy={`Graph-${cypress}`}>
      <ReactHighcharts config={config} />
    </div>
  )
}
