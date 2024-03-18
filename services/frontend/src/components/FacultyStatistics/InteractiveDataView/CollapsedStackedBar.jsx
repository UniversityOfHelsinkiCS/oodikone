/* eslint-disable react/no-this-in-sfc */
import React from 'react'
import ReactHighcharts from 'react-highcharts'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'

const colors = ['#7cb5ec', '#90ed7d', '#434348', '#f7a35c', '#FFF000', '#2b908f', '#f45b5b', '#91e8e1']

export const CollapsedStackedBar = ({ data, labels, longLabels, names, plotLinePlaces, differenceData }) => {
  const { getTextIn } = useLanguage()
  const transpose = matrix => {
    return matrix.reduce((prev, next) => next.map((_item, i) => (prev[i] || []).concat(next[i])), [])
  }
  if (names[0] === 'Started studying') names[0] += ' (new in faculty)'
  const dataTranspose = transpose(data)
    .map((obj, index) => ({ name: names[index], data: obj, color: colors[index] }))
    .reverse()

  const differenceArray = Object.keys(differenceData).reduce(
    (programmes, programme) => ({
      ...programmes,
      [programme]: differenceData[programme].reduce(
        (results, val, currentIndex) => ({
          ...results,
          [names[currentIndex]]: val,
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

  const chartPlotLinePlaces = plotLinePlaces
    ? plotLinePlaces.map(val => ({
        color: '#90A959',
        width: 1,
        value: val[0] - 0.5,
        dashStyle: 'solid',
        label: {
          text: val[1],
          style: {
            color: 'black',
            fontWeight: 'bold',
            fontSize: 14,
            position: 'absolute',
          },
          align: 'right',
          x: 0,
          y: 5,
        },
      }))
    : []

  // Point width is 24 px different multipliers adjusts the height.
  const getFlexHeight = len => {
    if (len > 7) return `${len * 24 * 1.5}px`
    if (len <= 2) return `${len * 24 * 6}px`
    if (len <= 4) return `${len * 24 * 3}px`
    return `${len * 24 * 2}px`
  }

  const getColor = change => {
    if (change > 0) return '#6ab04c'
    if (change < 0) return '#ff7979'
    return '#7B9FCF'
  }

  // Tooltip formatter function: this.<some value> needs to be used in order to obtain access to the values.
  const config = {
    chart: {
      type: 'bar',
      marginTop: 60,
      height: getFlexHeight(labels.length),
    },
    credits: {
      enabled: false,
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
      plotLines: chartPlotLinePlaces,
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
          color: 'gray',
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
      backgroundColor: 'white',
      borderColor: '#CCC',
      borderWidth: 1,
      shadow: false,
    },
    tooltip: {
      shared: true,
      backgroundColor: 'white',
      fontSize: '25px',
      formatter() {
        let tooltipString = `<b>${getTextIn(longLabels[this.x])}</b><br /><p>${this.x} - ${
          longLabels[this.x]?.code
        }</p><br />`
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
  return <ReactHighcharts config={config} />
}
