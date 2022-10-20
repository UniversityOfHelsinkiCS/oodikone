/* eslint-disable react/no-this-in-sfc */
import React from 'react'
import Highcharts from 'highcharts'
import ReactHighcharts from 'react-highcharts'

const colors = ['#7cb5ec', '#90ed7d', '#434348', '#f7a35c', '#FFF000', '#2b908f', '#f45b5b', '#91e8e1']

const CollapsedStackedBar = ({ data, labels, longLabels, names, language, differenceData, extraHeight }) => {
  const transpose = matrix => {
    return matrix.reduce((prev, next) => next.map((_item, i) => (prev[i] || []).concat(next[i])), [])
  }

  const needsExtra = extraHeight === 'EXTRA HEIGHT'
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

  // Point width is 24 px different multipliers adjusts the height.
  const getFlexHeight = (len, needsExtra) => {
    if (len > 7 && needsExtra) return `${len * 24 * 1.5}px`
    if (len > 5 && !needsExtra) return `${len * 24 * 1.5}px`
    if (needsExtra && len <= 2) return `${len * 24 * 6}px`
    if (needsExtra && len <= 4) return `${len * 24 * 3}px`
    if (needsExtra) return `${len * 24 * 2}px`
    if (len <= 2) return `${len * 24 * 5}px`
    if (len <= 4) return `${len * 24 * 3}px`
    return `${len * 24}px`
  }

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
      height: getFlexHeight(labels.length, needsExtra),
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
        let tooltipString = `<b>${
          longLabels[this.x] && longLabels[this.x][language] ? longLabels[this.x][language] : longLabels[this.x].fi
        }</b><br /><p>${this.x} - ${longLabels[this.x]?.code}</p><br />`
        const diffArray = differenceArray[this.x]
        this.points.forEach(point => {
          tooltipString += `<span style="color:${point.color}">●</span> <b>${point.series.name}: ${point.y}</b>
          (<span style="color:${getColor(diffArray[point.series.name])};font-weight:bold">${getCorrectSign(
            diffArray[point.series.name]
          )}</span>)<br />`
        })
        tooltipString += `<b>Total: ${this.points.reduce((prev, current) => prev + current.y, 0)}</b>`
        return tooltipString
      },
    },
    plotOptions: {
      series: {
        stacking: 'normal',
        pointWidth: 20,
        dataLabels: {
          enabled: true,
          align: 'left',
          formatter() {
            if (Number.isInteger(this.y)) return `${this.y}`
            return `${this.y.toFixed(1)}`
          },
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

  if (!dataTranspose) {
    return <>No data provided</>
  }
  return <ReactHighcharts config={defaultConfig} />
}

export default CollapsedStackedBar
