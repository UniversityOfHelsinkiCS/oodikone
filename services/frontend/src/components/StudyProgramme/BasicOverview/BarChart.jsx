import React from 'react'
import ReactHighcharts from 'react-highcharts'

import { creditsHref, creditsText } from '@/constants'

const colors = ['#003E65', '#1392c2', '#036415']

export const BarChart = ({ cypress, data }) => {
  const dataWithColors = data?.graphStats?.map((series, index) => ({ ...series, color: colors[index] }))

  const config = {
    title: {
      text: '',
    },
    series: dataWithColors,
    credits: {
      href: creditsHref,
      text: creditsText,
    },
    xAxis: {
      categories: data?.years,
    },
    chart: {
      type: 'column',
      height: '450px',
    },
    exporting: {
      filename: `oodikone_graduations_and_thesis_of_studyprogramme_${data?.id}`,
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

  if (!data) return null
  return (
    <div className="graph-container" data-cy={`Graph-${cypress}`}>
      <ReactHighcharts config={config} />
    </div>
  )
}
