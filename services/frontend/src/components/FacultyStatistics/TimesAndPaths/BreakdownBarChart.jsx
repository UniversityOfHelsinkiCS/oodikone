/* eslint-disable react/no-this-in-sfc */
import React from 'react'
import ReactHighcharts from 'react-highcharts'

import { useLanguage } from 'components/LanguagePicker/useLanguage'

export const BreakdownBarChart = ({
  data,
  handleClick,
  facultyGraph = true,
  year = null,
  label,
  programmeNames,
  universityMode,
}) => {
  const { language } = useLanguage()

  const statData = [
    { name: 'On time', color: '#90A959', data: [] },
    { name: 'Max. year overtime', color: '#FEE191', data: [] },
    { name: 'Overtime', color: '#FB6962', data: [] },
  ]

  let categories = []
  const codeMap = {}

  // eslint-disable-next-line no-restricted-syntax
  for (const item of data) {
    statData[0].data = [...statData[0].data, item.statistics.onTime]
    statData[1].data = [...statData[1].data, item.statistics.yearOver]
    statData[2].data = [...statData[2].data, item.statistics.wayOver]
    categories = [...categories, item.name]
    if (!facultyGraph) {
      codeMap[item.name || item.code] = item.code
    }
  }

  const getHeight = () => {
    if (data.length === 1) {
      return 250
    }
    const t = data.length > 8 ? 80 : 110
    return data.length * t + 100
  }

  const getTooltipText = (programmeId, seriesName, amount) => {
    if (!facultyGraph) {
      const code = codeMap[programmeId]
      return `<b>${
        programmeNames[code]?.[language] ? programmeNames[code]?.[language] : programmeNames[code]?.fi
      }</b><br />${code}<br /><b>${seriesName}</b>: ${amount}`
    }
    return `<b>${seriesName}</b>: ${amount}`
  }

  const getLabel = () => {
    if (universityMode) {
      return facultyGraph ? 'Graduation year' : 'Faculty'
    }
    return facultyGraph ? label : 'Programme'
  }

  const config = {
    chart: {
      type: 'bar',
      height: getHeight(),
      margin: [70, 0],
    },
    title: { text: ' ' },
    series: statData,
    tooltip: {
      backgroundColor: 'white',
      fontSize: '25px',
      // outside: true,
      // eslint-disable-next-line
      formatter: function () {
        return getTooltipText(this.x, this.series.name, this.y)
      },
    },
    xAxis: {
      type: 'category',
      categories,
      title: {
        text: getLabel(),
        align: 'high',
        offset: 0,
        rotation: 0,
        y: -10,
      },
    },
    yAxis: {
      min: 0,
      // max: maxValue,
      title: { text: 'Number of students' },
      labels: {
        overflow: 'justify',
      },
      allowDecimals: false,
      showFirstLabel: false,
    },
    credits: {
      href: 'https://toska.dev',
      text: 'oodikone | TOSKA',
    },
    plotOptions: {
      bar: {
        dataLabels: {
          enabled: true,
          align: 'right',
          color: '#424949',
          style: {
            textOutline: 'none',
          },
          formatter() {
            return this.y !== 0 ? this.y : ''
          },
        },
      },
      series: {
        pointWidth: data.length > 8 ? 16 : 20,
        groupPadding: 0.15,
        point: {
          events: {
            click(e) {
              handleClick(e, facultyGraph, categories[this.x])
            },
          },
        },
      },
    },
  }
  if (!facultyGraph) config.title.text = `Year ${year} by ${label.toLowerCase()}`

  return (
    <div className={`${facultyGraph ? 'faculty' : 'programmes'}-breakdown-graph`}>
      <ReactHighcharts config={config} />
    </div>
  )
}
