import React from 'react'

const ReactHighcharts = require('react-highcharts')

const getColors = len => {
  if (len < 8) return ['#f57368', '#fb8c6e', '#fba678', '#dbda7d', '#9ec27c', '#60a866', '#008c59']
  return ['#e66067', '#f57368', '#fb8c6e', '#fba678', '#dbda7d', '#9ec27c', '#60a866', '#008c59']
}

const FacultyBarChart = ({ cypress, data }) => {
  if (!data.stats) return null

  const colors = getColors(Object.keys(data.stats).length)
  const dataWithColors = Object.values(data.stats).map((series, index) => ({ ...series, color: colors[index] }))
  const getFileName = () => {
    return `oodikone_progress_of_students_in_${data?.id}_by_study_start_year`
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

export default FacultyBarChart
