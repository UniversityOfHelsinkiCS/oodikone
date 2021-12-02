import React from 'react'

const ReactHighcharts = require('react-highcharts')

const colors = ['#003E65', '#1392c2', '#036415']

const StackedBarChart = ({ data }) => {
  const dataWithColors = data?.graphStats?.map((series, index) => ({ ...series, color: colors[index] }))

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
    <div className="graph-container">
      <ReactHighcharts config={defaultConfig} />
    </div>
  )
}

export default StackedBarChart
