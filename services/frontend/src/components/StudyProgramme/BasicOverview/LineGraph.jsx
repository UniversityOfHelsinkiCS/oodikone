import React from 'react'

import '../studyprogramme.css'

const ReactHighcharts = require('react-highcharts')
require('highcharts-exporting')(ReactHighcharts.Highcharts)

// const colors = ['#003E65', '#1392c2', '#E68825', '#333737', '#036415']
const colors = ['#7cb5ec', '#434348', '#90ed7d', '#f7a35c', '#8085e9', '#2b908f', '#f45b5b', '#91e8e1']

const LineGraph = ({ cypress, data }) => {
  const dataWithColors = data?.graphStats.map((series, index) => ({
    ...series,
    color: colors[index],
  }))

  const defaultConfig = {
    title: {
      text: '',
    },
    series: dataWithColors,
    credits: {
      text: 'oodikone | TOSKA',
    },
    exporting: {
      filename: `oodikone_student_statistics_of_studyprogramme_${data?.id}`,
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
    chart: {
      height: '450px',
    },
    xAxis: {
      categories: data?.years,
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
    <div className="graph-container" data-cy={`Graph-${cypress}`}>
      <ReactHighcharts config={defaultConfig} />
    </div>
  )
}

export default LineGraph
