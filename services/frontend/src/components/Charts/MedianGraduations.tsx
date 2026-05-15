import Box from '@mui/material/Box'
import useTheme from '@mui/material/styles/useTheme'
import ReactECharts from 'echarts-for-react'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import {
  FacultyClassSizes,
  GraduationStatistics,
  GraduationStats,
  Name,
  NameWithCode,
  ProgrammeClassSizes,
} from '@oodikone/shared/types'
import { getOnEvents, getSeriesLabel } from './util'

type GraduationPoint = GraduationStats & { color?: string; realGoal?: number }

export const MedianGraduations = ({
  classSizes,
  cypress,
  data,
  expandKey,
  fullWidth,
  goal,
  goalExceptions,
  handleClick,
  level,
  mode,
  names,
  title,
  yearLabel,
}: {
  classSizes?: FacultyClassSizes['programmes'] | ProgrammeClassSizes['studyTracks' | 'programme']
  cypress: string
  data: GraduationStats[]
  expandKey?: string
  facultyGraph?: boolean
  fullWidth?: true,
  goal: number
  goalExceptions?: Record<string, number> | { needed: boolean }
  handleClick: (seriesCategory: string) => void | undefined
  level?: string
  mode: 'faculty' | 'programme' | 'study track'
  names?: Record<string, Name | NameWithCode>
  title: string
  yearLabel: 'Graduation year' | 'Start year'
}) => {
  const { language } = useLanguage()
  const theme = useTheme()

  let modData: GraduationPoint[] | null = null
  if (!expandKey && goalExceptions?.needed && level && ['master', 'bcMsCombo'].includes(level)) {
    // change colors for longer medicine goal times
    modData = JSON.parse(JSON.stringify(data))
    if (modData) {
      for (const item of modData) {
        if (item.code && Object.keys(goalExceptions).includes(item.code)) {
          const realGoal = goal + goalExceptions[item.code]
          if (item.median <= realGoal) {
            item.color = theme.palette.graduationTimes.onTime
          } else if (item.median <= realGoal + 12) {
            item.color = theme.palette.graduationTimes.yearOver
          } else {
            item.color = theme.palette.graduationTimes.wayOver
          }
          item.realGoal = realGoal
        }
      }
    }
  }

  const maxValue = data.reduce((max, { median }) => {
    return median > max ? median : max
  }, goal * 2)

  const getClassSize = (category: string) => {
    return expandKey ? classSizes?.[category]?.[expandKey ?? ''] : classSizes?.[category]
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
    statistics: GraduationStatistics | undefined,
    realGoal: number | undefined
  ) => {
    const sortingText =
      yearLabel === 'Start year'
        ? `<b>From class of ${!expandKey ? name : expandKey}, ${amount}/${getClassSize(code)} students have graduated</b>`
        : `<b>${amount} students graduated in year ${!expandKey ? name : expandKey}</b>`
    const timeText = `<br />${sortingText}<br /><b>median study time: ${median} semesters</b><br />`
    const statisticsText = `<br />${statistics?.onTime} graduated on time<br />${statistics?.yearOver} graduated max year overtime<br />${statistics?.wayOver} graduated over year late`

    if (expandKey) {
      const goalText = realGoal ? `<br /><p><b>** Exceptional goal time: ${realGoal} semesters **</b></p>` : ''
      return `<b>${getFacultyOrProgrammeName(code)}</b> • ${code}<br />${timeText}${statisticsText}${goalText}`
    }
    return `${timeText}${statisticsText}`
  }

  const resolveBarColor = (median: number, override?: string) => {
    if (override) {
      return override
    }
    if (median <= goal) {
      return theme.palette.graduationTimes.onTime
    }
    if (median <= goal + 2) {
      return theme.palette.graduationTimes.yearOver
    }
    return theme.palette.graduationTimes.wayOver
  }

  const dataWithOverrides: GraduationPoint[] = modData ?? data
  const seriesData = dataWithOverrides.map(item => ({
    value: item.median,
    name: item.name.toString(),
    code: item.code ?? item.name,
    amount: item.amount,
    statistics: item.statistics,
    realGoal: item.realGoal,
    itemStyle: {
      color: resolveBarColor(item.median, item.color),
    },
  }))

  const option = {
    title: {
      text: expandKey ? `Year ${expandKey} by ${yearLabel.toLowerCase()}` : '',
      left: 'center',
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: 'white',
      confine: true,
      formatter: (params: {
        name?: string
        value?: number
        data?: {
          code?: string
          amount?: number
          statistics?: GraduationStatistics
          realGoal?: number
          name?: string
        }
      }) => {
        const chartData = params.data
        if (!chartData) {
          return ''
        }
        const name = params.name ?? chartData.name ?? ''
        const code = chartData.code ?? name
        const amount = chartData.amount ?? 0
        const median = typeof params.value === 'number' ? params.value : Number(params.value)
        return getTooltipText(name, code, amount, median, chartData.statistics, chartData.realGoal)
      },
    },
    grid: {
      top: 60,
      left: 15,
      right: 20,
      bottom: 30,
      containLabel: true,
    },
    toolbox: {
      feature: {
        saveAsImage: {
          name: 'Oodikone-graduation-medians',
        },
      },
    },
    xAxis: {
      type: 'value',
      min: 0,
      max: maxValue,
      name: 'Graduation time (semesters)',
      nameLocation: 'middle',
      nameGap: 32,
      minInterval: 1,
    },
    yAxis: {
      type: 'category',
      data: seriesData.map(item => item.name),
      name: getSeriesLabel(expandKey, yearLabel, mode),
      nameLocation: 'start',
      nameGap: 12,
      inverse: true,
      z: 10,
    },
    series: [
      {
        type: 'bar',
        data: seriesData,
        label: {
          show: true,
          position: 'insideLeft',
          color: '#424949',
          formatter: (params: { name?: string; data?: { amount?: number; code?: string } }) => {
            const amount = params.data?.amount ?? 0
            const code = params.data?.code ?? params.name ?? ''
            return getDataLabel(amount, code)
          },
        },
        labelLayout: {
          hideOverlap: true,
        },
        markLine: {
          symbol: 'none',
          label: {
            show: false,
          },
          lineStyle: {
            width: 2,
          },
          data: [
            {
              xAxis: goal,
              lineStyle: {
                color: theme.palette.graduationTimes.onTime,
                type: 'dashed',
              },
            },
            {
              xAxis: goal + 2,
              lineStyle: {
                color: theme.palette.graduationTimes.yearOver,
                type: 'dashed',
              },
            },
          ],
        },
      },
    ],
  }

  return (
    <Box data-cy={cypress} width={{ sm: '100%', md: fullWidth ? '100%' : '50%' }}>
      <ReactECharts onEvents={getOnEvents(handleClick)} option={option} opts={{ renderer: 'svg' }} style={{ height: getHeight() }} />
    </Box>
  )
}
