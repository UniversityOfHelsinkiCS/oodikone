/* eslint-disable react/no-this-in-sfc */
import React from 'react'
import Highcharts from 'highcharts'
import ReactHighcharts from 'react-highcharts'

const colors = ['#7cb5ec', '#434348', '#90ed7d', '#f7a35c', '#8085e9', '#2b908f', '#f45b5b', '#91e8e1']

const CollapsedStackedBar = ({ data, labels, longLabels, names, language, differenceData }) => {
  const transpose = matrix => {
    return matrix.reduce((prev, next) => next.map((_item, i) => (prev[i] || []).concat(next[i])), [])
  }

  const dataTranspose = transpose(data)
    .map((obj, idx) => ({ name: names[idx], data: obj, color: colors[idx] }))
    .reverse()

  const differenceArray = Object.keys(differenceData).reduce(
    (programmes, programme) => ({
      ...programmes,
      [programme]: differenceData[programme].reduce(
        (results, val, currentIdx) => ({
          ...results,
          [names[currentIdx]]: val,
        }),
        {}
      ),
    }),
    {}
  )
  const getCorrectSign = change => {
    if (change > 0) return `+${change.toString()}`
    return change
  }
  const flexHeight = labels.length < 6 ? `${(1 / 3) * 100}%` : `${labels.length * (1 / 22) * 100}%`

  const getColor = change => {
    if (change > 0) return '#6ab04c'
    if (change < 0) return '#ff7979'
    return '#7B9FCF'
  }

  // Tooltip formatter function: this.<some value> needs to be used in order to obtain access to the values.
  const defaultConfig = {
    chart: {
      type: 'bar',
      marginTop: 60,
      height: flexHeight,
      scrollablePlotArea: {
        minWidth: 700,
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
      fontSize: '24px',
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
        fontSize: '24px',
      },
    },
    legend: {
      layout: 'horizontal',
      align: 'left',
      fontSize: '24px',
      x: 20,
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
        let tooltipString = `<b>${longLabels[this.x][language]}</b><br /><p>${this.x}</p><br />`
        const diffArray = differenceArray[this.x]
        this.points.forEach(point => {
          tooltipString += `<span style="color:${point.color}">●</span> <b>${point.series.name}: ${point.y}</b>
          (<span style="color:${getColor(diffArray[point.series.name])};font-weight:bold">${getCorrectSign(
            diffArray[point.series.name]
          )}</span>)<br />`
        })
        return tooltipString
      },
    },
    plotOptions: {
      series: {
        stacking: 'normal',
        pointWidth: 25,
        dataLabels: {
          enabled: true,
          fontSize: '24px',
        },
      },
    },
  }

  if (!dataTranspose) {
    return <>No data provided</>
  }
  return <ReactHighcharts config={defaultConfig} />
}

export default CollapsedStackedBar
