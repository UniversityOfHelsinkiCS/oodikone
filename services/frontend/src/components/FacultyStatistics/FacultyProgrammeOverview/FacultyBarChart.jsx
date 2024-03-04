import React from 'react'
import ReactHighcharts from 'react-highcharts'

import { generateGradientColors } from '@/common'
import { creditsHref, creditsText } from '@/constants'

export const FacultyBarChart = ({ cypress, data }) => {
  if (!data.stats) return null

  const colors = generateGradientColors(Object.keys(data.stats).length)
  const dataWithColors = Object.values(data.stats).map((series, index) => ({ ...series, color: colors[index] }))
  const getFileName = () => {
    return `oodikone_progress_of_students_in_${data?.id}_by_study_start_year`
  }

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
    plotOptions: {
      column: {
        stacking: 'percent',
        dataLabels: {
          enabled: true,
          format: '{point.percentage:.1f}%',
        },
      },
    },
    exporting: {
      filename: getFileName(),
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
    yAxis: {
      allowDecimals: false,
      min: 0,
      reversed: false,
      title: '',
    },
  }

  return (
    <div className="graph-container" data-cy={`Graph-${cypress}`}>
      <ReactHighcharts config={config} />
    </div>
  )
}
