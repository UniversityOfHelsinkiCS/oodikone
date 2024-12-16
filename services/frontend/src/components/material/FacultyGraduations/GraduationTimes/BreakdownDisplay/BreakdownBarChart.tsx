/* eslint-disable react/no-this-in-sfc */
import { Box, useTheme } from '@mui/material'
import HighCharts from 'highcharts'
import accessibility from 'highcharts/modules/accessibility'
import exportData from 'highcharts/modules/export-data'
import exporting from 'highcharts/modules/exporting'
import ReactHighcharts from 'react-highcharts'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { GraduationStats, Name, NameWithCode } from '@shared/types'

exporting(ReactHighcharts.Highcharts)
exportData(ReactHighcharts.Highcharts)
accessibility(ReactHighcharts.Highcharts)

export const BreakdownBarChart = ({
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
  data: Array<GraduationStats & { code?: string }>
  facultyGraph?: boolean
  handleClick: (event, isFacultyGraph: boolean, seriesCategory?: number) => void
  mode: 'faculty' | 'programme'
  names?: Record<string, Name | NameWithCode>
  year?: number | null
  yearLabel?: 'Graduation year' | 'Start year'
}) => {
  const { language } = useLanguage()
  const theme = useTheme()

  const statData: HighCharts.SeriesBarOptions[] = [
    { type: 'bar', name: 'On time', color: theme.palette.graduationTimes.onTime, data: [] },
    { type: 'bar', name: 'Max. year overtime', color: theme.palette.graduationTimes.yearOver, data: [] },
    { type: 'bar', name: 'Overtime', color: theme.palette.graduationTimes.wayOver, data: [] },
  ]

  let categories: number[] = []
  const codeMap = {}

  for (const item of data) {
    ;(statData[0].data as number[]).push(item.statistics.onTime)
    ;(statData[1].data as number[]).push(item.statistics.yearOver)
    ;(statData[2].data as number[]).push(item.statistics.wayOver)
    categories = [...categories, item.name]
    if (!facultyGraph) {
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
    return names[code]?.[language] ?? names[code]?.fi
  }

  const getTooltipText = (id: string, seriesName: string, amount: number) => {
    if (!facultyGraph) {
      const code = codeMap[id]
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

  const config: HighCharts.Options = {
    chart: {
      type: 'bar',
      height: getHeight(),
      margin: [70, 0],
    },
    title: { text: !facultyGraph ? `Year ${year} by ${yearLabel!.toLowerCase()}` : '' },
    series: statData.map(series => ({
      ...series,
      pointWidth: data.length > 8 ? 16 : 20,
      groupPadding: 0.15,
    })),
    tooltip: {
      backgroundColor: 'white',
      formatter() {
        return getTooltipText(this.x as string, this.series.name, this.y!)
      },
    },
    xAxis: {
      type: 'category',
      categories: categories.map(category => category.toString()),
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
      title: { text: 'Number of students' },
      labels: {
        overflow: 'justify',
      },
      allowDecimals: false,
      showFirstLabel: false,
    },
    credits: {
      enabled: false,
    },
    plotOptions: {
      bar: {
        dataLabels: {
          enabled: true,
          align: 'right',
          color: '#424949',
          style: {
            textOutline: 'none',
          },
          formatter() {
            return this.y !== 0 ? this.y : ''
          },
        },
      },
      series: {
        point: {
          events: {
            click(event) {
              handleClick(event, facultyGraph, categories[this.x])
            },
          },
        },
      },
    },
  }

  return (
    <Box data-cy={cypress} width={{ sm: '100%', md: '50%' }}>
      <ReactHighcharts config={config} />
    </Box>
  )
}
