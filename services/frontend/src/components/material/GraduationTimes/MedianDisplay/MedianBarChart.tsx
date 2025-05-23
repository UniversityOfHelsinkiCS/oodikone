/* eslint-disable react/no-this-in-sfc */
import Box from '@mui/material/Box'
import useTheme from '@mui/material/styles/useTheme'

import Highcharts from 'highcharts'
import accessibility from 'highcharts/modules/accessibility'
import exportData from 'highcharts/modules/export-data'
import exporting from 'highcharts/modules/exporting'
import ReactHighcharts from 'react-highcharts'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import {
  FacultyClassSizes,
  GraduationStatistics,
  GraduationStats,
  Name,
  NameWithCode,
  ProgrammeClassSizes,
} from '@oodikone/shared/types'

exporting(ReactHighcharts.Highcharts)
exportData(ReactHighcharts.Highcharts)
accessibility(ReactHighcharts.Highcharts)

export const MedianBarChart = ({
  classSizes,
  cypress,
  data,
  facultyGraph = true,
  goal,
  goalExceptions,
  handleClick,
  level,
  mode,
  names,
  title,
  year,
  yearLabel,
}: {
  classSizes: FacultyClassSizes['programmes'] | ProgrammeClassSizes['studyTracks']
  cypress: string
  data: GraduationStats[]
  facultyGraph?: boolean
  goal: number
  goalExceptions?: Record<string, number> | { needed: boolean }
  handleClick: (event, isFacultyGraph: boolean, seriesCategory?: number) => void
  level?: string
  mode: 'faculty' | 'programme' | 'study track'
  names?: Record<string, Name | NameWithCode>
  title: string
  year?: number | null
  yearLabel: 'Graduation year' | 'Start year'
}) => {
  const { language } = useLanguage()
  const theme = useTheme()

  let modData: Array<GraduationStats & { code: string; color: string; realGoal?: number }> | null = null
  if (!facultyGraph && goalExceptions?.needed && level && ['master', 'bcMsCombo'].includes(level)) {
    // change colors for longer medicine goal times
    modData = JSON.parse(JSON.stringify(data))
    for (const data of modData!) {
      if (Object.keys(goalExceptions).includes(data.code)) {
        const realGoal = goal + goalExceptions[data.code]
        if (data.median <= realGoal) {
          data.color = theme.palette.graduationTimes.onTime
        } else if (data.median <= realGoal + 12) {
          data.color = theme.palette.graduationTimes.yearOver
        } else {
          data.color = theme.palette.graduationTimes.wayOver
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

  const getFacultyOrProgrammeName = (code: string) => {
    if (!names) {
      return ''
    }
    return names[code]?.[language] ?? names[code]?.fi
  }

  const getTooltipText = (
    name: string,
    code: string,
    amount: number,
    median: number,
    statistics: GraduationStatistics,
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
      return `<b>${getFacultyOrProgrammeName(code)}</b> • ${code}<br />${timeText}${statisticsText}${goalText}`
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
      margin: [70, 0],
      height: getHeight(),
    },
    title: { text: !facultyGraph ? `Year ${year} by ${yearLabel.toLowerCase()}` : '' },
    tooltip: {
      backgroundColor: 'white',
      formatter() {
        const point = this.point as Highcharts.Point & {
          code?: string
          amount?: number
          statistics?: GraduationStatistics
          realGoal?: number
        }
        return getTooltipText(
          point.name,
          point.code ?? point.name,
          point.amount!,
          this.y!,
          point.statistics!,
          point.realGoal
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
      },
    },
    series: [
      {
        type: 'bar',
        data: (modData ?? data).map(item => ({
          ...item,
          y: item.median,
          name: item.name.toString(),
        })),
        dataLabels: {
          align: 'left',
          color: '#424949',
          style: {
            textOutline: 'none',
          },
          formatter() {
            const point = this.point as Highcharts.Point & {
              code?: string
              amount?: number
            }
            return getDataLabel(point.amount!, point.code ?? point.name)
          },
        },
        showInLegend: false,
        zones: [
          {
            value: goal + 0.1,
            color: theme.palette.graduationTimes.onTime,
          },
          {
            value: goal + 12.1,
            color: theme.palette.graduationTimes.yearOver,
          },
          {
            color: theme.palette.graduationTimes.wayOver,
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
          color: theme.palette.graduationTimes.onTime,
          width: 2,
          value: goal,
          dashStyle: 'ShortDash',
        },
        {
          color: theme.palette.graduationTimes.yearOver,
          width: 2,
          value: goal + 12,
          dashStyle: 'ShortDash',
        },
      ],
    },
  }

  return (
    <Box data-cy={cypress} width={{ sm: '100%', md: '50%' }}>
      <ReactHighcharts config={config} />
    </Box>
  )
}
