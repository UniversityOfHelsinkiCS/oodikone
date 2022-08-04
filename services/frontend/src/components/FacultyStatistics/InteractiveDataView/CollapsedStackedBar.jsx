import React from 'react'
import Highcharts from 'highcharts'
import ReactHighcharts from 'react-highcharts'

const CollapsedStackedBar = ({ data, labels, names }) => {
  const transpose = matrix => {
    return matrix.reduce((prev, next) => next.map((_item, i) => (prev[i] || []).concat(next[i])), [])
  }

  const dataTranspose = transpose(data)
    .map((obj, idx) => ({ name: names[idx], data: obj }))
    .reverse()

  const flexHeight = labels.length < 5 ? `${(1 / 4) * 100}%` : `${labels.length * (1 / 25) * 100}%`
  const defaultConfig = {
    chart: {
      type: 'bar',
      marginTop: 20,
      height: flexHeight,
      padding: 2,
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
      title: {
        text: '',
      },
    },
    yAxis: {
      min: 0,
      title: {
        text: '',
      },
      stackLabels: {
        enabled: true,
        style: {
          color: (Highcharts.defaultOptions.title.style && Highcharts.defaultOptions.title.style.color) || 'gray',
        },
      },
    },
    legend: {
      layout: 'vertical',
      align: 'right',
      x: -20,
      verticalAlign: 'bottom',
      y: -10,
      floating: true,
      backgroundColor: Highcharts.defaultOptions.legend.backgroundColor || 'white',
      borderColor: '#CCC',
      borderWidth: 1,
      shadow: false,
    },
    tooltip: {
      shared: true,
    },
    plotOptions: {
      series: {
        stacking: 'normal',
        pointWidth: 25,
        dataLabels: {
          enabled: true,
        },
        groupPadding: 4,
        pointPadding: 4,
      },
    },
  }

  return <ReactHighcharts config={defaultConfig} />
}

export default CollapsedStackedBar
