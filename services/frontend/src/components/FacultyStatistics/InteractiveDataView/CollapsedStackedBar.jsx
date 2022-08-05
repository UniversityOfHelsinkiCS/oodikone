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

  const flexHeight = labels.length < 6 ? `${(1 / 3) * 100}%` : `${labels.length * (1 / 22) * 100}%`
  const defaultConfig = {
    chart: {
      type: 'bar',
      marginTop: 40,
      height: flexHeight,
      scrollablePlotArea: {
        minWidth: 650,
      },
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
      layout: 'horizontal',
      align: 'left',
      x: 40,
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
    },
    plotOptions: {
      series: {
        stacking: 'normal',
        pointWidth: 25,
        dataLabels: {
          enabled: true,
        },
      },
    },
  }

  return <ReactHighcharts config={defaultConfig} />
}

export default CollapsedStackedBar
