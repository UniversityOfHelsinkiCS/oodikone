/* eslint-disable react/no-this-in-sfc */
import Highcharts from 'highcharts'
import accessibility from 'highcharts/modules/accessibility'
import exportData from 'highcharts/modules/export-data'
import exporting from 'highcharts/modules/exporting'
import ReactHighcharts from 'react-highcharts'

import { Section } from '@/components/material/Section'

exporting(ReactHighcharts.Highcharts)
exportData(ReactHighcharts.Highcharts)
accessibility(ReactHighcharts.Highcharts)

type Statistics = { onTime: number; yearOver: number; wayOver: number }

export const MedianTimeBarChart = ({
  byStartYear,
  data,
  goal,
  title,
}: {
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
}) => {
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
    if (byStartYear && title !== 'Bachelor + master study right') {
      return `${amount} graduated (${getPercentage(amount, classSize)} % of class)`
    }
    return `${amount} graduated`
  }

  const getHeight = () => {
    const multiplier = data.length > 8 ? 35 : 55
    return data.length * multiplier + 100
  }

  const getTooltipText = (amount: number, y: number, year: string, statistics: Statistics, classSize: number) => {
    const sortingText =
      byStartYear && title !== 'Bachelor + master study right'
        ? `<b>From class of ${year}, ${amount}/${classSize} students have graduated</b>`
        : `<b>${amount} students graduated in year ${year}</b>`

    const timeText = `<br />${sortingText}<br /><b>median study time: ${y} months</b><br />`

    const statisticsText = `<br />${statistics.onTime} graduated on time<br />${statistics.yearOver} graduated max year overtime<br />${statistics.wayOver} graduated over year late`

    return `${timeText}${statisticsText}`
  }

  const config: Highcharts.Options = {
    chart: {
      type: 'bar',
      width: 700,
      margin: [70, 0],
      height: getHeight(),
    },
    title: { text: title },
    tooltip: {
      backgroundColor: 'white',
      formatter() {
        const point = this.point as Highcharts.Point & {
          amount: number
          name: string
          statistics: Statistics
          classSize: number
        }
        return getTooltipText(point.amount, this.y!, point.name, point.statistics, point.classSize)
      },
    },
    plotOptions: {
      series: {
        dataLabels: {
          enabled: true,
          inside: true,
          overflow: 'allow' as const,
        },
      },
    },
    series: [
      {
        type: 'bar',
        data,
        dataLabels: {
          align: 'left',
          color: '#424949',
          style: {
            textOutline: 'none',
          },
          formatter() {
            const point = this.point as Highcharts.Point & { amount: number; classSize: number }
            return getDataLabel(point.amount, point.classSize)
          },
        },
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
          dashStyle: 'ShortDash',
        },
        {
          color: '#FEE191',
          width: 2,
          value: goal + 12,
          dashStyle: 'ShortDash',
        },
      ],
    },
  }

  return (
    <Section cypress={`${title.split(' ')[0].toLowerCase()}-median-time-bar-chart`}>
      <ReactHighcharts config={config} />
    </Section>
  )
}
