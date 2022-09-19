/* eslint-disable react/no-this-in-sfc */
import React from 'react'
import Highcharts from 'highcharts'
import ReactHighcharts from 'react-highcharts'

const getColors = len => {
  if (len < 8) return ['#f57368', '#fb8c6e', '#fba678', '#dbda7d', '#9ec27c', '#60a866', '#008c59']
  return ['#e66067', '#f57368', '#fb8c6e', '#fba678', '#dbda7d', '#9ec27c', '#60a866', '#008c59']
}

const ProgrammeProgressChart = ({ data, labels, longLabels, names, language }) => {
  const transpose = matrix => {
    return matrix.reduce((prev, next) => next.map((_item, i) => (prev[i] || []).concat(next[i])), [])
  }

  const colors = getColors(data[0].length)
  const dataTranspose = transpose(data)
    .map((obj, idx) => ({ name: names[idx], data: obj, color: colors[idx] }))
    .reverse()

  // Tooltip formatter function: this.<some value> needs to be used in order to obtain access to the values.
  const defaultConfig = {
    chart: {
      type: 'bar',
      marginTop: 60,
    },
    credits: {
      text: 'oodikone | TOSKA',
    },
    title: {
      text: '',
      style: {
        display: 'none',
      },
    },
    series: dataTranspose,
    xAxis: {
      categories: labels,
      fontSize: '24px',
    },
    yAxis: {
      allowDecimals: false,
      min: 0,
      reversed: true,
      title: '',
    },
    legend: {
      layout: 'horizontal',
      align: 'left',
      fontSize: '24px',
      x: 10,
      verticalAlign: 'top',
      y: -10,
      floating: true,
      backgroundColor: Highcharts.defaultOptions.legend.backgroundColor || 'white',
      borderColor: '#CCC',
      borderWidth: 1,
      shadow: false,
    },
    tooltip: {
      shared: true,
      backgroundColor: 'white',
      fontSize: '25px',
      formatter() {
        let tooltipString = `<b>${
          longLabels[this.x] && longLabels[this.x][language] ? longLabels[this.x][language] : longLabels[this.x].fi
        }</b><br /><p>${this.x}</p><br />`
        this.points.forEach(point => {
          tooltipString += `<span style="color:${point.color}">●</span> <b>${point.series.name}: ${point.y}</b>
          </span><br />`
        })
        return tooltipString
      },
    },
    plotOptions: {
      series: {
        stacking: 'percent',
        pointWidth: 24,
        dataLabels: {
          enabled: true,
          format: '{point.percentage:.1f}%',
          fontSize: '24px',
          filter: {
            property: 'y',
            operator: '>',
            value: 2,
          },
        },
      },
    },
  }

  return <ReactHighcharts config={defaultConfig} />
}

export default ProgrammeProgressChart
