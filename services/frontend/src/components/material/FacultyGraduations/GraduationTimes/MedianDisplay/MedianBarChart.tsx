/* eslint-disable react/no-this-in-sfc */
import { Box } from '@mui/material'
import Highcharts from 'highcharts'
import accessibility from 'highcharts/modules/accessibility'
import exportData from 'highcharts/modules/export-data'
import exporting from 'highcharts/modules/exporting'
import ReactHighcharts from 'react-highcharts'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { GraduationStats, NameWithCode } from '@/shared/types'

exporting(ReactHighcharts.Highcharts)
exportData(ReactHighcharts.Highcharts)
accessibility(ReactHighcharts.Highcharts)

export const MedianBarChart = ({
  classSizes,
  data,
  facultyGraph = true,
  facultyNames,
  goal,
  goalExceptions,
  handleClick,
  level,
  mode,
  title,
  year,
  yearLabel,
}: {
  classSizes: Record<string, number> | Record<string, Record<string, number>>
  data: GraduationStats[]
  facultyGraph?: boolean
  facultyNames: Record<string, NameWithCode>
  goal: number
  goalExceptions?: Record<string, number> & { needed: boolean }
  handleClick: (event, isFacultyGraph: boolean, seriesCategory?: number) => void
  level?: 'bachelor' | 'bcMsCombo' | 'master' | 'doctor'
  mode: 'faculty' | 'programme'
  title: string
  year?: number | null
  yearLabel: 'Graduation year' | 'Start year'
}) => {
  const { language } = useLanguage()

  let modData
  if (!facultyGraph && goalExceptions?.needed && level && ['master', 'bcMsCombo'].includes(level)) {
    // change colors for longer medicine goal times
    modData = JSON.parse(JSON.stringify(data))
    for (const data of modData) {
      if (Object.keys(goalExceptions).includes(data.code)) {
        const realGoal = goal + goalExceptions[data.code]
        if (data.median <= realGoal) {
          data.color = '#90A959'
        } else if (data.median <= realGoal + 12) {
          data.color = '#FEE191'
        } else {
          data.color = '#FB6962'
        }
        data.realGoal = realGoal
      }
    }
  }

  const maxValue = data.reduce((max, { median }) => {
    return median > max ? median : max
  }, goal * 2)

  const getClassSize = (category: string) => {
    if (facultyGraph) {
      return classSizes[category]
    }
    return classSizes[category][year!]
  }

  const getPercentage = (amount: number, category: string) => {
    const percent = Math.round((amount / getClassSize(category)) * 100 * 10) / 10
    return Number.isNaN(percent) ? 0 : percent
  }

  const getDataLabel = (amount: number, category: string) => {
    if (yearLabel === 'Start year' && title === 'Bachelor study right') {
      return `${amount} graduated (${getPercentage(amount, category)} % of class)`
    }
    return `${amount} graduated`
  }

  const getHeight = () => {
    const multiplier = data.length > 8 ? 35 : 55
    return data.length * multiplier + 100
  }

  const getTooltipText = (
    name: number,
    code: string,
    amount: number,
    median: number,
    statistics: { onTime: number; yearOver: number; wayOver: number },
    realGoal: number | undefined
  ) => {
    const sortingText =
      yearLabel === 'Start year'
        ? `<b>From class of ${facultyGraph ? name : year}, ${amount}/${getClassSize(code)} students have graduated</b>`
        : `<b>${amount} students graduated in year ${facultyGraph ? name : year}</b>`
    const timeText = `<br />${sortingText}<br /><b>median study time: ${median} months</b><br />`
    const statisticsText = `<br />${statistics.onTime} graduated on time<br />${statistics.yearOver} graduated max year overtime<br />${statistics.wayOver} graduated over year late`

    if (!facultyGraph) {
      const goalText = realGoal ? `<br /><p><b>** Exceptional goal time: ${realGoal} months **</b></p>` : ''
      return `<b>${
        facultyNames[code]?.[language] ? facultyNames[code]?.[language] : facultyNames[code]?.fi
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

  const config: Highcharts.Options = {
    chart: {
      type: 'bar',
      width: 700,
      margin: [70, 0],
      height: getHeight(),
    },
    title: { text: !facultyGraph ? `Year ${year} by ${yearLabel.toLowerCase()}` : '' },
    tooltip: {
      backgroundColor: 'white',
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
        animation: false,
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
        data: (modData ?? data).map(item => ({
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

  return (
    <Box width={{ sm: '100%', md: '50%' }}>
      <ReactHighcharts config={config} />
    </Box>
  )
}
