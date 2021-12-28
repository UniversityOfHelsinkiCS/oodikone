import React from 'react'

const ReactHighcharts = require('react-highcharts')

const colors = ['#333737', '#003E65', '#E68825', '#1392c2', '#003E65', '#036415']

const BarChart = ({ data }) => {
  if (!data) return null
  const dataWithColors = data?.creditGraphStats?.map((series, index) => ({ ...series, color: colors[index] }))

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
