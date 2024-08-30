/* eslint-disable func-names */
/* eslint-disable object-shorthand */
/* eslint-disable react/no-this-in-sfc */
import accessibility from 'highcharts/modules/accessibility'
import exportData from 'highcharts/modules/export-data'
import exporting from 'highcharts/modules/exporting'
import ReactHighcharts from 'react-highcharts'

exporting(ReactHighcharts.Highcharts)
exportData(ReactHighcharts.Highcharts)
accessibility(ReactHighcharts.Highcharts)

type Statistics = { onTime: number; yearOver: number; wayOver: number }

interface MedianTimeBarChartProps {
  byStartYear: boolean
  data: Array<{
    amount: number
    classSize: number
    name: string
    statistics: Statistics
    times: number[]
    y: number
  }>
  goal: number
  title: string
}

export const MedianTimeBarChart = ({ byStartYear, data, goal, title }: MedianTimeBarChartProps) => {
  if (!data) {
    return null
  }

  const maxValue = data.reduce((max: number, { y }) => {
    return y > max ? y : max
  }, goal * 2)

  const getPercentage = (amount: number, classSize: number) => {
    const percent = Math.round((amount / classSize) * 100 * 10) / 10
    return Number.isNaN(percent) ? 0 : percent
  }

  const getDataLabel = (amount: number, classSize: number) => {
    if (byStartYear) {
      return `${amount} graduated (${getPercentage(amount, classSize)} % of class)`
    }
    return `${amount} graduated`
  }

  const getHeight = () => {
    const multiplier = data.length > 8 ? 35 : 55
    return data.length * multiplier + 100
  }

  const getTooltipText = (amount: number, y: number, year: string, statistics: Statistics, classSize: number) => {
    const sortingText = byStartYear
      ? `<b>From class of ${year}, ${amount}/${classSize} students have graduated</b>`
      : `<b>${amount} students graduated in year ${year}</b>`

    const timeText = `<br />${sortingText}<br /><b>median study time: ${y} months</b><br />`

    const statisticsText = `<br />${statistics.onTime} graduated on time<br />${statistics.yearOver} graduated max year overtime<br />${statistics.wayOver} graduated over year late`

    return `${timeText}${statisticsText}`
  }

  const config = {
    chart: {
      type: 'bar',
      width: 700,
      margin: [70, 0],
      height: getHeight(),
    },
    title: { text: title },
    tooltip: {
      backgroundColor: 'white',
      fontSize: '25px',
      formatter: function (this: {
        y: number
        point: { amount: number; name: string; statistics: Statistics; classSize: number }
      }) {
        return getTooltipText(this.point.amount, this.y, this.point.name, this.point.statistics, this.point.classSize)
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
            formatter: function (this: { point: { amount: number; classSize: number } }) {
              return getDataLabel(this.point.amount, this.point.classSize)
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
        text: byStartYear ? 'Start year' : 'Graduation year',
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

  return (
    <div data-cy={`graduation-times-graph${title.split(' ')[0]}`}>
      <ReactHighcharts config={config} />
    </div>
  )
}
