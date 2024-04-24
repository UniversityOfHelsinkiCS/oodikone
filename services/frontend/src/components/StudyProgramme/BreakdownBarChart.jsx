/* eslint-disable react/no-this-in-sfc */
import React from 'react'
import ReactHighcharts from 'react-highcharts'

export const BreakdownBarChart = ({ data, title, byStartYear = false }) => {
  const statData = [
    { name: 'On time', color: '#90A959', data: [] },
    { name: 'Max. year overtime', color: '#FEE191', data: [] },
    { name: 'Overtime', color: '#FB6962', data: [] },
  ]

  let categories = []

  for (const item of data) {
    statData[0].data = [...statData[0].data, item.statistics.onTime]
    statData[1].data = [...statData[1].data, item.statistics.yearOver]
    statData[2].data = [...statData[2].data, item.statistics.wayOver]
    categories = [...categories, item.name]
  }

  const getHeight = () => {
    const t = data.length > 8 ? 80 : 110
    return data.length * t + 100
  }

  const getTooltipText = (seriesName, amount) => {
    return `<b>Graduated ${seriesName}</b>: ${amount} ${amount === 1 ? 'student' : 'students'}`
  }

  const config = {
    chart: {
      type: 'bar',
      height: getHeight(),
      margin: [70, 0],
    },
    title: { text: title },
    series: statData,
    tooltip: {
      backgroundColor: 'white',
      fontSize: '25px',
      // eslint-disable-next-line
      formatter: function () {
        return getTooltipText(this.series.name, this.y)
      },
    },
    xAxis: {
      type: 'category',
      categories,
      title: {
        text: byStartYear ? 'Start year' : 'Graduation year',
        align: 'high',
        offset: 0,
        rotation: 0,
        y: -10,
      },
    },
    yAxis: {
      min: 0,
      title: { text: 'Number of students' },
      labels: {
        overflow: 'justify',
      },
      allowDecimals: false,
      showFirstLabel: false,
    },
    credits: {
      enabled: false,
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
      },
    },
  }

  return (
    <div data-cy={`graduation-times-graph-breakdown${title.split(' ')[0]}`}>
      <ReactHighcharts config={config} />
    </div>
  )
}
