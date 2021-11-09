import React from 'react'

import '../studyprogramme.css'

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
      height: '400px',
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
  return (
    <div className="graph-container">
      <ReactHighcharts config={defaultConfig} />
    </div>
  )
}

export default LineGraph
