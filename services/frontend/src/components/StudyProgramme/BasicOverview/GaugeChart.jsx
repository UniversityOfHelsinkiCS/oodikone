import React from 'react'

const ReactHighcharts = require('react-highcharts')

const GaugeChart = ({ cypress, data, year, graduationAmount, studyprogramme }) => {
  if (!data || !graduationAmount || !data.length) return null

  const thresholdValues = studyprogramme.includes('KH') ? [36, 41] : [24, 27]

  const getColor = data => {
    if (data <= thresholdValues[0]) return ['#90A959', '#EBECF0']
    if (data > thresholdValues[0] && data <= thresholdValues[1]) return ['#FEE191', '#EBECF0']
    return ['#FB6962', '#EBECF0']
  }

  if (!data) return null
  const defaultConfig = {
    chart: {
      plotBackgroundColor: null,
      plotBorderWidth: 0,
      plotShadow: false,
      width: 260,
      height: 300,
    },
    title: {
      text: `${data[0][1]} kk`,
      align: 'center',
      verticalAlign: 'middle',
      y: 60,
    },
    subtitle: {
      text: `${year}<br/> n = ${graduationAmount}`,
      style: {
        fontWeight: 'bold',
        fontSize: '15px',
      },
    },
    credits: {
      text: '',
    },
    exporting: {
      enabled: false,
    },
    accessibility: {
      point: {
        valueSuffix: '%',
      },
    },
    plotOptions: {
      pie: {
        dataLabels: {
          title: '{point.percentage:.1f}%',
          distance: -50,
          style: {
            fontWeight: 'bold',
            color: 'white',
          },
        },
        startAngle: -90,
        endAngle: 90,
        center: ['50%', '75%'],
        size: '100%',
        colors: getColor(data[0][1]),
      },
    },
    tooltip: {
      enabled: false,
    },
    series: [
      {
        type: 'pie',
        name: '',
        innerSize: '40%',
        data,
      },
    ],
  }

  return <ReactHighcharts data-cy={`Graph-${cypress}`} config={defaultConfig} />
}

export default GaugeChart
