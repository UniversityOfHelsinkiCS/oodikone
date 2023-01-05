/* eslint-disable react/no-this-in-sfc */
import React from 'react'
import ReactHighcharts from 'react-highcharts'

const BarChart = ({
  data,
  goal,
  handleClick,
  facultyGraph = true,
  year,
  label,
  programmeNames,
  language = null,
  classSizes,
  level,
  goalExceptions,
}) => {
  let modData = null
  if (!facultyGraph && goalExceptions.needed && ['master', 'bcMsCombo'].includes(level)) {
    // change colors for longer medicine goal times
    modData = JSON.parse(JSON.stringify(data))
    for (let i = 0; i < modData.length; i++) {
      if (Object.keys(goalExceptions).includes(modData[i].code)) {
        const realGoal = goal + goalExceptions[modData[i].code]
        if (modData[i].y <= realGoal) {
          modData[i].color = '#90A959'
        } else if (modData[i].y <= realGoal + 12) {
          modData[i].color = '#FEE191'
        } else {
          modData[i].color = '#FB6962'
        }
        modData[i].realGoal = realGoal
      }
    }
  }

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
      return `${amount} graduated (${getPercentage(amount, category)} % of class)`
    }
    return `${amount} graduated`
  }

  const getHeight = () => {
    const t = data.length > 8 ? 35 : 55
    return data.length * t + 100
  }

  const getTooltipText = (name, code, amount, y, statistics, realGoal) => {
    const sortingText =
      label === 'Start year'
        ? `<b>From class of ${facultyGraph ? name : year}, ${amount}/${getClassSize(code)} students have graduated</b>`
        : `<b>${amount} students graduated in year ${facultyGraph ? name : year}</b>`
    const timeText = `<br /><p>${sortingText}, <br /><b> median study time: ${y} months</p></b>`
    const statisticsText = `<br /><p>${statistics.onTime} graduated on time</p><br />
        <p>${statistics.yearOver} graduated max year overtime</p>
        <br /><p>${statistics.wayOver} graduated over year late</p>`

    if (!facultyGraph) {
      const goalText = realGoal ? `<br /><p><b>** Exceptional goal time: ${realGoal} months **</b></p>` : ''
      return `<b>${
        programmeNames[code]?.[language] ? programmeNames[code]?.[language] : programmeNames[code]?.fi
      }</b><br />${code}${timeText}${statisticsText}${goalText}`
    }
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
      // outside: true,
      // eslint-disable-next-line
      formatter: function() {
        return getTooltipText(
          this.point.name,
          this.point.code,
          this.point.amount,
          this.y,
          this.point.statistics,
          this.point?.realGoal
        )
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
        data: modData || data,
        dataLabels: [
          {
            align: 'left',
            color: '#424949',
            style: {
              textOutline: 'none',
            },
            // eslint-disable-next-line
            formatter: function () {
              return getDataLabel(this.point.amount, this.point.code ? this.point.code : this.point.name)
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
      type: 'category',
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

  if (!facultyGraph) config.title.text = `Year ${year} by ${label.toLowerCase()}`

  return (
    <div className={`${facultyGraph ? 'faculty' : 'programmes'}-graph`}>
      <ReactHighcharts config={config} />
    </div>
  )
}

export default BarChart
