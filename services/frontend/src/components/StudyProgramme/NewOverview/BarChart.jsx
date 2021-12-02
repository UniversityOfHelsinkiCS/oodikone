import React from 'react'

const ReactHighcharts = require('react-highcharts')

const colors = ['#003E65', '#1392c2', '#036415']

const BarChart = ({ data, categories }) => {
  const dataWithColors = data?.map((series, index) => ({ ...series, color: colors[index] }))

  const defaultConfig = {
    title: {
      text: '',
    },
    series: dataWithColors,
    credits: {
      text: 'oodikone | TOSKA',
    },
    xAxis: {
      categories,
    },
    chart: {
      type: 'column',
      height: '450px',
    },
    plotOptions: {
      column: {
        dataLabels: {
          enabled: true,
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
    <div className="graph-container">
      <ReactHighcharts config={defaultConfig} />
    </div>
  )
}

export default BarChart
