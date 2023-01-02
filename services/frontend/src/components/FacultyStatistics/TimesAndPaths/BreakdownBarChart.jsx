import React from 'react'
import ReactHighcharts from 'react-highcharts'

const BarChart = ({
  data,
  // handleClick,
  facultyGraph = true,
  // year,
  // label,
  // programmeNames,
  // language = null,
  // showMeanTime,
  // level,
}) => {
  const statData = [
    { name: 'On time', color: '#90A959', data: [] },
    { name: 'Max. year overtime', color: '#FEE191', data: [] },
    { name: 'Overtime', color: '#FB6962', data: [] },
  ]

  let categories = []

  // eslint-disable-next-line no-restricted-syntax
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

  const config = {
    chart: {
      type: 'bar',
      height: getHeight(),
      margin: [70, 0],
    },
    title: { text: ' ' },
    series: statData,
    xAxis: {
      categories,
      title: {
        text: 'Graduation year', // facultyGraph ? label : 'Programme',
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
            // eslint-disable-next-line react/no-this-in-sfc
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
    <div className={`${facultyGraph ? 'faculty' : 'programmes'}-breakdown-graph`}>
      <ReactHighcharts config={config} />
    </div>
  )
}

export default BarChart
