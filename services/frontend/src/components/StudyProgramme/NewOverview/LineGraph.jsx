import React from 'react'

import '../studyprogramme.css'

const ReactHighcharts = require('react-highcharts')

const colors = ['#003E65', '#1392c2', '#E68825', '#333737', '#036415']

const LineGraph = ({ categories, data }) => {
  const dataWithColors = data?.map((series, index) => ({ ...series, color: colors[index] }))

  const defaultConfig = {
    title: {
      text: '',
    },
    series: dataWithColors,
    credits: {
      text: 'oodikone | TOSKA',
    },
    chart: {
      height: '450px',
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
