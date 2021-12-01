import React from 'react'

const ReactHighcharts = require('react-highcharts')

const colors = ['#003E65', '#1392c2', '#036415']

const StackedBarChart = ({ data, categories }) => {
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
      width: 950,
      height: 400,
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

  return <ReactHighcharts config={defaultConfig} />
}

export default StackedBarChart
