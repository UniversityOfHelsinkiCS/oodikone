import React from 'react'

const ReactHighcharts = require('react-highcharts')

const BarChart = ({ data }) => {
  const defaultConfig = {
    title: {
      text: '',
    },
    series: data,
    credits: {
      text: 'oodikone | TOSKA',
    },
    xAxis: {
      categories: ['2017', '2018', '2019', '2020', '2021'],
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
