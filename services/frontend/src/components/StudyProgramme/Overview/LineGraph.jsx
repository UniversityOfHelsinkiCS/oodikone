import React from 'react'

const ReactHighcharts = require('react-highcharts')

const LineGraph = ({ categories, data }) => {
  const defaultConfig = {
    title: {
      text: '',
    },
    series: data,
    credits: {
      text: 'oodikone | TOSKA',
    },
    chart: {
      width: 950,
      height: 400,
    },
    xAxis: {
      categories,
    },
    yAxis: {
      allowDecimals: false,
      min: 0,
      reversed: false,
      title: '',
    },
  }

  if (!data || !categories) return <div>No data available for the selected studyprogramme</div>
  return <ReactHighcharts config={defaultConfig} />
}

export default LineGraph
