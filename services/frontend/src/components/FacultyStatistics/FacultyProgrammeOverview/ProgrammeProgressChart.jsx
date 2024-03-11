/* eslint-disable react/no-this-in-sfc */
import React from 'react'
import ReactHighcharts from 'react-highcharts'

import { generateGradientColors } from '@/common'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'

export const ProgrammeProgressChart = ({ data, labels, longLabels, names }) => {
  const { getTextIn } = useLanguage()
  if (!data || data.length === 0) return <b>No data available</b>
  const transpose = matrix => {
    return matrix.reduce((prev, next) => next.map((_item, i) => (prev[i] || []).concat(next[i])), [])
  }

  const colors = generateGradientColors(data[0]?.length || 6)
  const dataTranspose = transpose(data).map((obj, idx) => ({ name: names[idx], data: obj, color: colors[idx] }))

  // Tooltip formatter function: this.<some value> needs to be used in order to obtain access to the values.
  const config = {
    chart: {
      type: 'bar',
      marginTop: 60,
      height: 80 + 45 * labels.length,
    },
    credits: {
      enabled: false,
    },
    title: {
      text: '',
    },
    series: dataTranspose,
    xAxis: {
      categories: labels,
    },
    yAxis: {
      min: 0,
      reversed: true,
      title: '',
    },
    legend: {
      verticalAlign: 'top',
      borderColor: '#CCC',
      borderWidth: 1,
    },
    tooltip: {
      shared: true,
      backgroundColor: 'white',
      formatter() {
        let tooltipString = `<b>${getTextIn(longLabels[this.x])}</b><br /><p>${this.x} - ${
          longLabels[this.x]?.code
        }</p><br />`
        this.points.forEach(point => {
          tooltipString += `<span style="color:${point.color}">●</span> ${point.series.name}: <b>${point.y}</b>
          </span><br />`
        })
        return tooltipString
      },
    },
    plotOptions: {
      series: {
        stacking: 'percent',
        dataLabels: {
          enabled: true,
          format: '{point.percentage:.1f}%',
          filter: {
            property: 'percentage',
            operator: '>',
            value: 3,
          },
        },
      },
    },
  }

  return <ReactHighcharts config={config} />
}
