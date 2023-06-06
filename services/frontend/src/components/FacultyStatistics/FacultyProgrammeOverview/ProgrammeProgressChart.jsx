/* eslint-disable react/no-this-in-sfc */
import React from 'react'
import Highcharts from 'highcharts'
import ReactHighcharts from 'react-highcharts'
import useLanguage from 'components/LanguagePicker/useLanguage'

const getColors = len => {
  if (len < 6) return ['#fba678', '#dbda7d', '#9ec27c', '#60a866', '#008c59']
  if (len < 8) return ['#f57368', '#fb8c6e', '#fba678', '#dbda7d', '#9ec27c', '#60a866', '#008c59']
  return ['#e66067', '#f57368', '#fb8c6e', '#fba678', '#dbda7d', '#9ec27c', '#60a866', '#008c59']
}
// Point width is 24 px different multipliers adjusts the height.
const getFlexHeight = (len, needsExtra) => {
  if (len > 7 && needsExtra) return `${len * 24 * 1.5}px`
  if (len > 5 && !needsExtra) return `${len * 24 * 1.5}px`
  if (needsExtra && len <= 2) return `${len * 24 * 6}px`
  if (needsExtra && len <= 4) return `${len * 24 * 3}px`
  if (needsExtra) return `${len * 24 * 2}px`
  if (len < 2) return `${len * 24 * 5}px`
  if (len < 3) return `${len * 24 * 4}px`
  if (len <= 4) return `${len * 24 * 3}px`
  return `${len * 24}px`
}
const ProgrammeProgressChart = ({ data, labels, longLabels, names, needsExtra }) => {
  const { getTextIn } = useLanguage()
  if (!data || data.length === 0)
    return (
      <>
        <b>No data available</b>
      </>
    )
  const transpose = matrix => {
    return matrix.reduce((prev, next) => next.map((_item, i) => (prev[i] || []).concat(next[i])), [])
  }

  const colors = getColors(data[0]?.length || 6)
  const dataTranspose = transpose(data)
    .map((obj, idx) => ({ name: names[idx], data: obj, color: colors[idx] }))
    .reverse()

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
        let tooltipString = `<b>${getTextIn(longLabels[this.x])}</b><br /><p>${this.x} - ${
          longLabels[this.x]?.code
        }</p><br />`
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
        pointWidth: 20,
        dataLabels: {
          enabled: true,
          format: '{point.percentage:.1f}%',
          color: '#000000',
          align: 'left',
          style: {
            textOutline: 'none',
          },
          filter: {
            property: 'percentage',
            operator: '>',
            value: 3,
          },
        },
      },
    },
  }

  return <ReactHighcharts config={defaultConfig} />
}

export default ProgrammeProgressChart
