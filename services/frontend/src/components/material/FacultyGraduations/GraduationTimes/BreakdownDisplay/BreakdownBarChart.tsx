/* eslint-disable react/no-this-in-sfc */
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
  data,
  handleClick,
  facultyGraph = true,
  year = null,
  mode,
  programmeNames,
  yearLabel,
}: {
  data: GraduationStats[]
  handleClick
  facultyGraph: boolean
  year: number | null
  mode: 'faculty' | 'programme'
  programmeNames?: Record<string, NameWithCode>
  yearLabel?: 'Graduation year' | 'Start year'
}) => {
  const { language } = useLanguage()

  const statData = [
    { name: 'On time', color: '#90A959', data: [] },
    { name: 'Max. year overtime', color: '#FEE191', data: [] },
    { name: 'Overtime', color: '#FB6962', data: [] },
  ]

  let categories = []
  const codeMap = {}

  for (const item of data) {
    statData[0].data = [...statData[0].data, item.statistics.onTime]
    statData[1].data = [...statData[1].data, item.statistics.yearOver]
    statData[2].data = [...statData[2].data, item.statistics.wayOver]
    categories = [...categories, item.name]
    if (!facultyGraph) {
      codeMap[item.name || item.code] = item.code
    }
  }

  const getHeight = () => {
    if (data.length === 1) {
      return 250
    }
    const multiplier = data.length > 8 ? 80 : 110
    return data.length * multiplier + 100
  }

  const getTooltipText = (programmeId, seriesName, amount) => {
    if (!facultyGraph) {
      const code = codeMap[programmeId]
      return `<b>${
        programmeNames[code]?.[language] ? programmeNames[code]?.[language] : programmeNames[code]?.fi
      }</b><br />${code}<br /><b>${seriesName}</b>: ${amount}`
    }
    return `<b>${seriesName}</b>: ${amount}`
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
      height: getHeight(),
      margin: [70, 0],
    },
    title: { text: ' ' },
    series: statData,
    tooltip: {
      backgroundColor: 'white',
      formatter() {
        return getTooltipText(this.x, this.series.name, this.y)
      },
    },
    xAxis: {
      type: 'category',
      categories,
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
        pointWidth: data.length > 8 ? 16 : 20,
        groupPadding: 0.15,
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

  if (!facultyGraph) {
    config.title.text = `Year ${year} by ${yearLabel.toLowerCase()}`
  }

  return <ReactHighcharts config={config} />
}
