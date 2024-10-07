/* eslint-disable react/no-this-in-sfc */
import accessibility from 'highcharts/modules/accessibility'
import exportData from 'highcharts/modules/export-data'
import exporting from 'highcharts/modules/exporting'
import ReactHighcharts from 'react-highcharts'

exporting(ReactHighcharts.Highcharts)
exportData(ReactHighcharts.Highcharts)
accessibility(ReactHighcharts.Highcharts)

export const MedianBarChart = ({
  classSizes,
  data,
  facultyGraph = true,
  goal,
  goalExceptions,
  handleClick,
  language = null,
  level,
  mode,
  programmeNames,
  year,
  yearLabel,
}) => {
  let modData = null
  if (!facultyGraph && goalExceptions.needed && ['master', 'bcMsCombo'].includes(level)) {
    // change colors for longer medicine goal times
    modData = JSON.parse(JSON.stringify(data))
    for (let i = 0; i < modData.length; i++) {
      if (Object.keys(goalExceptions).includes(modData[i].code)) {
        const realGoal = goal + goalExceptions[modData[i].code]
        if (modData[i].median <= realGoal) {
          modData[i].color = '#90A959'
        } else if (modData[i].median <= realGoal + 12) {
          modData[i].color = '#FEE191'
        } else {
          modData[i].color = '#FB6962'
        }
        modData[i].realGoal = realGoal
      }
    }
  }

  const maxValue = data.reduce((max, { median }) => {
    return median > max ? median : max
  }, goal * 2)

  const getClassSize = category => {
    if (facultyGraph) return classSizes[category]
    return classSizes[category][year]
  }

  const getPercentage = (amount, category) => {
    const percent = Math.round((amount / getClassSize(category)) * 100 * 10) / 10
    return Number.isNaN(percent) ? 0 : percent
  }

  const getDataLabel = (amount, category) => {
    if (yearLabel === 'Start year') {
      return `${amount} graduated (${getPercentage(amount, category)} % of class)`
    }
    return `${amount} graduated`
  }

  const getHeight = () => {
    const multiplier = data.length > 8 ? 35 : 55
    return data.length * multiplier + 100
  }

  const getTooltipText = (name, code, amount, median, statistics, realGoal) => {
    const sortingText =
      yearLabel === 'Start year'
        ? `<b>From class of ${facultyGraph ? name : year}, ${amount}/${getClassSize(code)} students have graduated</b>`
        : `<b>${amount} students graduated in year ${facultyGraph ? name : year}</b>`
    const timeText = `<br />${sortingText}<br /><b>median study time: ${median} months</b><br />`
    const statisticsText = `<br />${statistics.onTime} graduated on time<br />${statistics.yearOver} graduated max year overtime<br />${statistics.wayOver} graduated over year late`

    if (!facultyGraph) {
      const goalText = realGoal ? `<br /><p><b>** Exceptional goal time: ${realGoal} months **</b></p>` : ''
      return `<b>${
        programmeNames[code]?.[language] ? programmeNames[code]?.[language] : programmeNames[code]?.fi
      }</b><br />${code}${timeText}${statisticsText}${goalText}`
    }
    return `${timeText}${statisticsText}`
  }

  const getLabel = () => {
    if (mode === 'faculty') {
      return facultyGraph ? 'Graduation year' : 'Faculty'
    }
    return facultyGraph ? yearLabel : `${mode.charAt(0).toUpperCase()}${mode.slice(1)}`
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
      formatter() {
        return getTooltipText(
          this.point.name,
          this.point.code ? this.point.code : this.point.name,
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
        data: (modData || data).map(item => ({
          ...item,
          y: item.median,
        })),
        dataLabels: [
          {
            align: 'left',
            color: '#424949',
            style: {
              textOutline: 'none',
            },
            formatter() {
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
            click(event) {
              handleClick(event, facultyGraph)
            },
          },
        },
      },
    ],
    xAxis: {
      type: 'category',
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
      enabled: false,
    },
  }

  if (!facultyGraph) config.title.text = `Year ${year} by ${yearLabel.toLowerCase()}`

  return (
    <div className={`${facultyGraph ? 'faculty' : 'programmes'}-graph`}>
      <ReactHighcharts config={config} />
    </div>
  )
}
