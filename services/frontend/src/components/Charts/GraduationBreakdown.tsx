import Box from '@mui/material/Box'
import useTheme from '@mui/material/styles/useTheme'
import ReactECharts from 'echarts-for-react'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { GraduationStats, Name, NameWithCode } from '@oodikone/shared/types'

export const GraduationBreakdown = ({
  cypress,
  data,
  facultyGraph = true,
  handleClick,
  mode,
  names,
  year = null,
  yearLabel,
}: {
  cypress: string
  data: GraduationStats[]
  facultyGraph?: boolean
  handleClick: (event, isFacultyGraph: boolean, seriesCategory?: number | string) => void
  mode: 'faculty' | 'programme' | 'study track'
  names?: Record<string, Name | NameWithCode> | Record<string, string | Name>
  year?: number | null
  yearLabel?: 'Graduation year' | 'Start year'
}) => {
  const { language } = useLanguage()
  const theme = useTheme()

  const categories = data.map(item => item.name.toString())
  const codeMap: Record<string, string | undefined> = {}

  if (!facultyGraph) {
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
    if (!facultyGraph) {
      const code = codeMap[id] ?? ''
      return `<b>${getFacultyOrProgrammeName(code)}</b> • ${code}<br /><b>${seriesName}</b>: ${amount}`
    }
    return `<b>${seriesName}</b>: ${amount}`
  }

  const getLabel = () => {
    if (mode === 'faculty') {
      return facultyGraph ? 'Graduation year' : 'Faculty'
    }
    return facultyGraph ? yearLabel! : `${mode.charAt(0).toUpperCase()}${mode.slice(1)}`
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
      text: !facultyGraph ? `Year ${year} by ${yearLabel!.toLowerCase()}` : '',
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
    grid: {
      top: 60,
      left: 10,
      right: 20,
      bottom: 30,
      containLabel: true,
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

  const onEvents = {
    click: (params: { name?: string }) => {
      if (!params.name) {
        return
      }
      handleClick({ point: { name: params.name } }, facultyGraph, params.name)
    },
  }

  return (
    <Box data-cy={cypress} width={{ sm: '100%', md: '50%' }}>
      <ReactECharts onEvents={onEvents} option={option} opts={{ renderer: 'svg' }} style={{ height: getHeight() }} />
    </Box>
  )
}
