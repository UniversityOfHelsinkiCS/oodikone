/* eslint-disable react/no-this-in-sfc */
import React from 'react'
import ReactHighcharts from 'react-highcharts'

const BarChart = ({
  data,
  categories,
  goal,
  handleClick,
  facultyGraph = true,
  year,
  label,
  programmeNames,
  language = null,
  showMeanTime,
  classSizes,
  level,
}) => {
  const maxValue = data.reduce((max, { y }) => {
    return y > max ? y : max
  }, goal * 2)

  const getClassSize = category => {
    if (facultyGraph) return classSizes[category]
    if (level === 'master' || level === 'bcMsCombo') {
      return classSizes[category][level][year]
    }
    return classSizes[category][year]
  }

  const getPercentage = (amount, category) => {
    const percent = Math.round((amount / getClassSize(category)) * 100 * 10) / 10
    return Number.isNaN(percent) ? 0 : percent
  }

  const getDataLabel = (amount, category) => {
    if (label === 'Start year') {
      return `${amount} student${amount === 1 ? '' : 's'} (${getPercentage(amount, category)} %)`
    }
    return `${amount} student${amount === 1 ? '' : 's'}`
  }

  const getHeight = () => {
    const t = categories.length > 10 ? 35 : 55
    return categories.length * t + 100
  }

  const getTooltipText = (category, amount, y, statistics) => {
    const sortingText =
      label === 'Start year'
        ? `<b>From class of ${facultyGraph ? category : year}, ${amount}/${getClassSize(
            category
          )} students have graduated</b>`
        : `<b>${amount} students graduated in year ${facultyGraph ? category : year}</b>`
    const timeText = `<br /><p>${sortingText}, <br /><b>${
      showMeanTime ? 'mean' : 'median'
    } study time: ${y} months</p></b>`
    const statisticsText = `<br /><p>${statistics.onTime} graduated on time</p><br />
        <p>${statistics.yearOver} graduated max year overtime</p>
        <br /><p>${statistics.wayOver} graduated over year late</p>`

    if (!facultyGraph)
      return `<b>${
        programmeNames[category]?.[language] ? programmeNames[category]?.[language] : programmeNames[category]?.fi
      }</b><br />${category}${timeText}${statisticsText}`

    return `${timeText}${statisticsText}`
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
        return getTooltipText(this.x, this.point.amount, this.y, this.point.statistics)
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

        // groupPadding: 0.1,
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
              return getDataLabel(this.point.amount, this.x)
            },
          },
          // {
          //   align: 'right',
          //   format: '{y}',
          //   color: '#EBECF0',
          // },
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
        point: {
          events: {
            click(e) {
              handleClick(e, facultyGraph)
            },
          },
        },
      },
    ],
    xAxis: {
      categories,
      title: {
        text: facultyGraph ? label : 'Programme',
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
      ],
    },
    credits: {
      text: 'oodikone | TOSKA',
    },
  }

  if (!facultyGraph) config.title.text = `Year ${year} by ${label.toLowerCase()}`

  return (
    <div>
      <ReactHighcharts config={config} />
    </div>
  )
}

export default BarChart
