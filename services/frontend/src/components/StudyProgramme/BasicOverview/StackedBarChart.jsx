/* eslint-disable react/no-this-in-sfc */
import React from 'react'

const ReactHighcharts = require('react-highcharts')

// const colors = ['#003E65', '#1392c2', '#036415', '#bdc2c7', '#E68825', '#333737', '#54997b', '#195f8a']
const colors = ['#7cb5ec', '#434348', '#90ed7d', '#f7a35c', '#8085e9', '#2b908f', '#f45b5b', '#91e8e1']

const StackedBarChart = ({ cypress, data, labels, wideTable }) => {
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
      categories: labels,
      allowDecimals: false,
    },
    chart: {
      type: 'column',
      height: '450px',
    },
    exporting: {
      filename: `oodikone_credits_produced_by_studyprogramme_${data?.id}`,
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
    plotOptions: {
      column: {
        stacking: 'normal',
        dataLabels: {
          enabled: true,
          formatter() {
            if (Number.isInteger(this.y)) return `${this.y}`
            return `${this.y.toFixed(1)}`
          },
        },
      },
    },
    tooltip: {
      pointFormat: '<b>{series.name}: {point.percentage:.1f} %</b>',
    },
    yAxis: {
      allowDecimals: false,
      min: 0,
      reversed: false,
      title: '',
    },
  }

  if (!data) return <></>
  return (
    <div className={`graph-container${wideTable ? '-narrow' : ''}`} data-cy={`Graph-${cypress}`}>
      <ReactHighcharts config={defaultConfig} />
    </div>
  )
}

export default StackedBarChart
