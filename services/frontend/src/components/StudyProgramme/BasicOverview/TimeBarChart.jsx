/* eslint-disable react/no-this-in-sfc */
import React from 'react'
import ReactHighcharts from 'react-highcharts'

const TimeBarChart = ({ data, goal, showMeanTime }) => {
  const maxValue = data.reduce((max, { y }) => {
    return y > max ? y : max
  }, goal * 2)

  const getDataLabel = amount => {
    // if (label === 'Start year') {
    //   return `${amount} graduated (${getPercentage(amount, category)} % of class)`
    // }
    return `${amount} graduated`
  }

  const getHeight = () => {
    const t = data.length > 8 ? 35 : 55
    return data.length * t + 100
  }

  const getTooltipText = (amount, y, year) => {
    const sortingText = `<b>${amount} students graduated in year ${year}</b>`
    const timeText = `<br /><p>${sortingText}, <br /><b>${
      showMeanTime ? 'mean' : 'median'
    } study time: ${y} months</p></b>`
    // const statisticsText = `<br /><p>${statistics.onTime} graduated on time</p><br />
    //     <p>${statistics.yearOver} graduated max year overtime</p>
    //     <br /><p>${statistics.wayOver} graduated over year late</p>`

    // return `${timeText}${statisticsText}`
    return timeText
  }

  const config = {
    chart: {
      type: 'bar',
      width: 700,
      margin: [70, 0],
      height: getHeight(),
    },
    title: { text: ' ' },
    tooltip: {
      backgroundColor: 'white',
      fontSize: '25px',
      // eslint-disable-next-line
      formatter: function() {
        return getTooltipText(this.point.amount, this.y, this.point.name) // , this.point.statistics)
      },
    },
    plotOptions: {
      series: {
        dataLabels: {
          enabled: true,
          inside: true,
          overflow: 'allow',
        },
        pointPadding: 0.0,
      },
    },
    series: [
      {
        data,
        dataLabels: [
          {
            align: 'left',
            color: '#424949',
            style: {
              textOutline: 'none',
            },
            // eslint-disable-next-line
            formatter: function () {
              return getDataLabel(this.point.amount)
            },
          },
        ],
        showInLegend: false,
        zones: [
          {
            value: goal + 0.1,
            color: '#90A959',
          },
          {
            value: goal + 12.1,
            color: '#FEE191',
          },
          {
            color: '#FB6962',
          },
        ],
      },
    ],
    xAxis: {
      type: 'category',
      title: {
        text: 'Graduation year',
        align: 'high',
        offset: 0,
        rotation: 0,
        y: -10,
      },
    },
    yAxis: {
      min: 0,
      max: maxValue,
      title: { text: 'Graduation time (months)' },
      labels: {
        overflow: 'justify',
      },
      allowDecimals: false,
      showFirstLabel: false,
      plotLines: [
        {
          color: '#90A959',
          width: 2,
          value: goal,
          dashStyle: 'shortDash',
        },
        {
          color: '#FEE191',
          width: 2,
          value: goal + 12,
          dashStyle: 'shortDash',
        },
      ],
    },
    credits: {
      text: 'oodikone | TOSKA',
    },
  }

  return (
    <div data-cy="graduation-times-graph">
      <ReactHighcharts config={config} />
    </div>
  )
}

export default TimeBarChart
