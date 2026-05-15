import Box from '@mui/material/Box'
import useTheme from '@mui/material/styles/useTheme'
import ReactECharts from 'echarts-for-react'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { GraduationStats, Name, NameWithCode } from '@oodikone/shared/types'
import { getOnEvents } from './util'


type GraduationProps =
  | {
    cypress: string
    data: GraduationStats[]
    fullWidth: true
    mode: 'faculty' | 'programme' | 'study track'

    yearLabel?: never
    handleClick?: never
    names?: never
    expandKey?: never
  }
  | {
    cypress: string
    data: GraduationStats[]
    handleClick: (seriesCategory: string) => void
    mode: 'faculty' | 'programme' | 'study track'

    yearLabel?: never
    names?: never
    expandKey?: never
    fullWidth?: never
  }
  | {
    cypress: string
    data: GraduationStats[]
    handleClick: (seriesCategory: string) => void
    mode: 'faculty' | 'programme' | 'study track'
    names: Record<string, Name | NameWithCode> | Record<string, string | Name> | undefined
    expandKey: string
    yearLabel: 'Graduation year' | 'Start year'

    fullWidth?: never
  }

export const GraduationBreakdown = ({
  cypress,
  data,
  fullWidth,
  handleClick,
  mode,
  names,
  expandKey,
  yearLabel,
}: GraduationProps) => {
  const { language } = useLanguage()
  const theme = useTheme()

  const categories = data.map(item => item.name)
  const codeMap: Record<string, string | undefined> = {}

  if (expandKey) {
    for (const item of data) {
      codeMap[item.name || item.code!] = item.code
    }
  }

  const getHeight = () => {
    if (data.length === 1) {
      return 250
    }
    const multiplier = data.length > 8 ? 80 : 110
    return data.length * multiplier + 100
  }

  const getFacultyOrProgrammeName = (code: string) => {
    if (!names) {
      return ''
    }
    const name = names[code]
    if (typeof name === 'string') {
      return name
    }
    return name?.[language] ?? name?.fi ?? ''
  }

  const getTooltipText = (id: string, seriesName: string, amount: number) => {
    if (expandKey) {
      const code = codeMap[id] ?? ''
      return `<b>${getFacultyOrProgrammeName(code)}</b> • ${code}<br /><b>${seriesName}</b>: ${amount}`
    }
    return `<b>${seriesName}</b>: ${amount}`
  }

  const getLabel = () => {
    if (mode === 'faculty') {
      return expandKey ? 'Graduation year' : 'Faculty'
    }
    return expandKey ? yearLabel : `${mode.charAt(0).toUpperCase()}${mode.slice(1)}`
  }

  const barWidth = data.length > 8 ? 16 : 20

  const series = [
    {
      name: 'On time',
      color: theme.palette.graduationTimes.onTime,
      data: data.map(item => item.statistics.onTime),
    },
    {
      name: 'Max. year overtime',
      color: theme.palette.graduationTimes.yearOver,
      data: data.map(item => item.statistics.yearOver),
    },
    {
      name: 'Overtime',
      color: theme.palette.graduationTimes.wayOver,
      data: data.map(item => item.statistics.wayOver),
    },
  ].map(seriesItem => ({
    type: 'bar',
    name: seriesItem.name,
    barWidth,
    data: seriesItem.data,
    itemStyle: {
      color: seriesItem.color,
    },
    label: {
      show: true,
      position: 'right',
      color: '#424949',
      formatter: (params: { value?: number }) => {
        const value = typeof params.value === 'number' ? params.value : Number(params.value)
        return value ? `${value}` : ''
      },
    },
    emphasis: {
      focus: 'series',
    },
  }))

  const option = {
    title: {
      text: expandKey ? `Year ${expandKey} by ${yearLabel?.toLowerCase()}` : '',
      left: 'center',
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: 'white',
      formatter: (params: { name?: string; seriesName?: string; value?: number }) => {
        const id = params.name ?? ''
        const seriesName = params.seriesName ?? ''
        const amount = typeof params.value === 'number' ? params.value : Number(params.value)
        return getTooltipText(id, seriesName, amount)
      },
    },
    toolbox: {
      feature: {
        dataView: {
          readOnly: true,
          title: 'View table data',
        },
        saveAsImage: {
          name: 'Oodikone-graduation-breakdown',
        },
      },
    },
    grid: {
      top: 60,
      left: 10,
      right: 20,
      bottom: 60,
      containLabel: true,
    },
    legend: {
      bottom: 0,
    },
    xAxis: {
      type: 'value',
      min: 0,
      minInterval: 1,
      name: 'Number of students',
      nameLocation: 'middle',
      nameGap: 32,
    },
    yAxis: {
      type: 'category',
      data: categories,
      name: getLabel(),
      nameLocation: 'start',
      nameGap: 12,
      inverse: true,
      z: 10,
    },
    series,
  }


  return (
    <Box data-cy={cypress} width={{ sm: '100%', md: fullWidth ? '100%' : '50%' }}>
      <ReactECharts onEvents={getOnEvents(handleClick)} option={option} opts={{ renderer: 'svg' }} style={{ height: getHeight() }} />
    </Box>
  )
}
