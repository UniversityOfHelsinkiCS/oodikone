/* eslint-disable react/no-this-in-sfc */
import { Box, useTheme } from '@mui/material'
import HighCharts from 'highcharts'
import accessibility from 'highcharts/modules/accessibility'
import exportData from 'highcharts/modules/export-data'
import exporting from 'highcharts/modules/exporting'
import ReactHighcharts from 'react-highcharts'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { GraduationStats, NameWithCode } from '@/shared/types'

exporting(ReactHighcharts.Highcharts)
exportData(ReactHighcharts.Highcharts)
accessibility(ReactHighcharts.Highcharts)

export const BreakdownBarChart = ({
  cypress,
  data,
  handleClick,
  facultyGraph = true,
  facultyNames,
  year = null,
  mode,
  yearLabel,
}: {
  cypress: string
  data: Array<GraduationStats & { code?: string }>
  handleClick: (event, isFacultyGraph: boolean, seriesCategory?: number) => void
  facultyGraph?: boolean
  facultyNames?: Record<string, NameWithCode>
  year?: number | null
  mode: 'faculty' | 'programme'
  yearLabel?: 'Graduation year' | 'Start year'
}) => {
  const { language } = useLanguage()
  const theme = useTheme()

  const statData: HighCharts.SeriesBarOptions[] = [
    { type: 'bar', name: 'On time', color: theme.graduationTimes.onTime, data: [] },
    { type: 'bar', name: 'Max. year overtime', color: theme.graduationTimes.yearOver, data: [] },
    { type: 'bar', name: 'Overtime', color: theme.graduationTimes.wayOver, data: [] },
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

  const getFacultyName = (code: string) => {
    if (!facultyNames) {
      return ''
    }
    return facultyNames[code]?.[language] ?? facultyNames[code]?.fi
  }

  const getTooltipText = (id: string, seriesName: string, amount: number) => {
    if (!facultyGraph) {
      const code = codeMap[id]
      return `<b>${getFacultyName(code)}</b> • ${code}<br /><b>${seriesName}</b>: ${amount}`
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
        animation: false,
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
