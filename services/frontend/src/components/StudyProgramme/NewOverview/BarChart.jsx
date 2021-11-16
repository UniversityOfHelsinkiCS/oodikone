import React from 'react'

const ReactHighcharts = require('react-highcharts')

const BarChart = ({ data, years }) => {
  const defaultConfig = {
    title: {
      text: '',
    },
    series: data,
    credits: {
      text: 'oodikone | TOSKA',
    },
    xAxis: {
      categories: years,
    },
    chart: {
      type: 'column',
      width: 950,
      height: 400,
    },
    plotOptions: {
      column: {
        stacking: 'normal',
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

export default BarChart
