import React from 'react'
import NoDataMessage from '../NoDataMessage'

const ReactHighcharts = require('react-highcharts')

const colors = ['#333737', '#bdc2c7', '#79b0e8', '#1392c2', '#195f8a', '#54997b', '#036415']

const BarChart = ({ cypress, data, track }) => {
  if (!data || !data.creditGraphStats || !data.creditGraphStats[track])
    return <NoDataMessage message="No progress data for the studytrack found. Try with another studytrack" />

  const correctData = data?.creditGraphStats[track]
  const dataWithColors = Object.values(correctData).map((series, index) => ({ ...series, color: colors[index] }))

  const getFileName = () => {
    if (track === '' || track === 'studyprogramme') {
      return `oodikone_progress_of_students_in_${data?.id}_by_study_start_year`
    }
    return `oodikone_progress_of_students_in_${data?.id}_${track}_by_study_start_year`
  }

  const defaultConfig = {
    title: {
      text: '',
    },
    series: dataWithColors,
    credits: {
      text: 'oodikone | TOSKA',
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
      filename: getFileName(),
      width: 2200,
      height: 1400,
      sourceWidth: 1200,
      sourceHeight: 600,
      buttons: {
        contextButton: {
          menuItems: ['viewFullscreen', 'downloadPNG', 'downloadSVG', 'downloadPDF'],
        },
      },
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
      <ReactHighcharts config={defaultConfig} />
    </div>
  )
}

export default BarChart
