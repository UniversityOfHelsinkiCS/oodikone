import Button from '@mui/material/Button'
import FormControlLabel from '@mui/material/FormControlLabel'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import dayjs from 'dayjs'
import ReactECharts, { EChartsInstance } from 'echarts-for-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { populationStatisticsToolTips } from '@/common/InfoToolTips'
import {
  getGraduationDataPoints,
  getGraduationsByCodes,
  getIncludedCourseCodesByProgrammeCodes,
} from '@/components/Charts/util'
import { InfoBox } from '@/components/InfoBox/InfoBoxWithTooltip'
import { DateFormat } from '@/constants/date'
import { reformatDate } from '@/util/timeAndDate'
import { CreditTypeCode, FormattedStudent } from '@oodikone/shared/types'

const INITIAL_GRAPH_HEIGHT = 600

/**
 * Credit accumulation graph for **class statistics**
 *
 * @param students filteredStudents (size must be more than 0)
 * @param programmeCodes array of 1 or 2 (for combined programme) codes
 * @param studyPlanFilter whether hops filter is active
 * @param showBachelorAndMaster (optional)
 */
export const CreditAccumulationGraph = ({
  students,
  programmeCodes,
  studyPlanFilter,
  showBachelorAndMaster,
}: {
  students: FormattedStudent[]
  programmeCodes: string[]
  studyPlanFilter: boolean
  showBachelorAndMaster?: boolean
}) => {
  const [graphHeight, setGraphHeight] = useState(INITIAL_GRAPH_HEIGHT)
  const [cutStudyplanCredits, setCutStudyplanCredits] = useState(false)

  // Is same for all students in a population
  const populationStudyStart = new Date(students[0].studyrightStart).getTime()
  const creditDateThreshold = useMemo(
    () =>
      studyPlanFilter && !cutStudyplanCredits
        ? Math.min(...students.flatMap(s => s.courses.map(c => new Date(c.date).getTime())))
        : populationStudyStart,
    [studyPlanFilter, cutStudyplanCredits, students, populationStudyStart]
  )

  const studyRightStartMarker = studyPlanFilter
    ? [
        {
          name: 'Population study start',
          type: 'line',

          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: {
              color: '#ff0000',
              type: 'dashed',
              width: 3,
            },
            label: {
              show: true,
              formatter: 'Population study start',
              position: 'insideEndTop',
            },
            data: [{ xAxis: populationStudyStart }],
          },
        },
      ]
    : []

  const creditPoints = useMemo(
    () =>
      students.map(student => {
        const includedCourseCodes = getIncludedCourseCodesByProgrammeCodes(student, programmeCodes)

        const courses = student.courses
          .filter(c => {
            const courseCode = c.course_code ?? (c as { course?: { code?: string } }).course?.code

            return (
              dayjs(c.date).isSameOrAfter(creditDateThreshold) &&
              !c.isStudyModuleCredit &&
              (studyPlanFilter ? !!courseCode && includedCourseCodes.has(courseCode) : true)
            )
          })
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

        let credits = 0
        const points: number[][] = []
        const markPointsForStudent: any[] = []
        const graduations = getGraduationsByCodes(student, programmeCodes, !!showBachelorAndMaster)

        for (const c of courses) {
          if (c.credittypecode === CreditTypeCode.PASSED || c.credittypecode === CreditTypeCode.APPROVED) {
            credits += c.credits
            points.push([new Date(c.date).getTime(), credits])
          }
        }

        // Guard: students can graduate without having a single course in hops
        if (points.length) {
          graduations.forEach(grad => getGraduationDataPoints(points, markPointsForStudent, grad))
          points.sort((a, b) => a[0] - b[0])
        }

        return {
          name: student.studentNumber,
          type: 'line',
          showSymbol: false,
          markPoint: markPointsForStudent.length
            ? {
                symbol: 'diamond',
                symbolSize: 20,
                data: markPointsForStudent,
              }
            : undefined,
          symbolSize: 8,
          symbol: 'emptyCircle',
          data: points,
          smooth: 0.1,
          emphasis: { focus: 'series' },
          sampling: 'lttb',
        }
      }),
    [creditDateThreshold, students, studyPlanFilter, programmeCodes, showBachelorAndMaster]
  )

  const [chartInstance, setChartInstance] = useState<EChartsInstance | null>(null)
  const lastHighlightedRef = useRef<{ seriesIndex: number; dataIndex: number } | null>(null)

  const handleChartReady = useCallback((chart: EChartsInstance) => {
    setChartInstance(chart)
  }, [])

  const resetHighlight = useCallback((chart: any) => {
    const last = lastHighlightedRef.current
    if (last) {
      chart.dispatchAction({ type: 'downplay', seriesIndex: last.seriesIndex, dataIndex: last.dataIndex })
      lastHighlightedRef.current = null
    }
    chart.dispatchAction({ type: 'hideTip' })
  }, [])

  useEffect(() => {
    const chart = chartInstance
    if (!chart) return () => undefined

    const zr = chart.getZr()

    const handleMouseMove = (event: { offsetX?: number; offsetY?: number }) => {
      const offsetX = event?.offsetX
      const offsetY = event?.offsetY

      if (offsetX == null || offsetY == null) return

      if (!chart.containPixel('grid', [offsetX, offsetY])) {
        resetHighlight(chart)
        return
      }

      let nearestSeriesIndex: number | null = null
      let nearestDataIndex: number | null = null
      let nearestDist2 = Number.POSITIVE_INFINITY

      creditPoints.forEach((series, seriesIndex) => {
        if (!Array.isArray(series.data) || series.data.length === 0) return

        series.data.forEach((point, dataIndex) => {
          if (!Array.isArray(point) || point.length < 2) return

          const pixel = chart.convertToPixel({ xAxisIndex: 0, yAxisIndex: 0 }, point)
          if (!Array.isArray(pixel)) return

          const dx = pixel[0] - offsetX
          const dy = pixel[1] - offsetY
          const dist2 = dx * dx + dy * dy

          if (dist2 < nearestDist2) {
            nearestSeriesIndex = seriesIndex
            nearestDataIndex = dataIndex
            nearestDist2 = dist2
          }
        })
      })

      if (nearestSeriesIndex == null || nearestDataIndex == null) return

      const next = { seriesIndex: nearestSeriesIndex, dataIndex: nearestDataIndex }

      const last = lastHighlightedRef.current
      if (last && last.seriesIndex === next.seriesIndex && last.dataIndex === next.dataIndex) return

      if (last) {
        chart.dispatchAction({ type: 'downplay', seriesIndex: last.seriesIndex, dataIndex: last.dataIndex })
      }

      chart.dispatchAction({ type: 'highlight', seriesIndex: next.seriesIndex, dataIndex: next.dataIndex })
      chart.dispatchAction({ type: 'showTip', seriesIndex: next.seriesIndex, dataIndex: next.dataIndex })
      lastHighlightedRef.current = next
    }

    const handleGlobalOut = () => resetHighlight(chart)
    const handleClick = (event: { offsetX?: number; offsetY?: number }) => {
      const offsetX = event?.offsetX
      const offsetY = event?.offsetY

      if (offsetX == null || offsetY == null) return
      if (!chart.containPixel('grid', [offsetX, offsetY])) return

      const last = lastHighlightedRef.current
      if (!last) return

      const studentNumber = creditPoints[last.seriesIndex]?.name
      if (!studentNumber) return

      window.open(`/students/${studentNumber}`, '_blank', 'noopener,noreferrer')
    }

    zr.on('mousemove', handleMouseMove)
    zr.on('globalout', handleGlobalOut)
    zr.on('click', handleClick)

    return () => {
      zr.off('mousemove', handleMouseMove)
      zr.off('globalout', handleGlobalOut)
      zr.off('click', handleClick)
    }
  }, [chartInstance, creditPoints, resetHighlight])

  const option = useMemo(
    () => ({
      tooltip: {
        trigger: 'item',
        triggerOn: 'none',
        position: (_point: unknown, params: { value?: [number, number] }) => {
          const value = params?.value
          if (!Array.isArray(value)) return null

          const chart = chartInstance
          if (!chart) return null

          const pixel = chart.convertToPixel({ xAxisIndex: 0, yAxisIndex: 0 }, value)
          if (!Array.isArray(pixel)) return null

          return [pixel[0], pixel[1]]
        },
        formatter: (params: { seriesName?: string; value?: [number, number] }) => {
          const { value } = params
          if (!Array.isArray(value)) return params.seriesName ?? ''

          const [timestamp, credits] = value
          const dateLabel = reformatDate(new Date(timestamp), DateFormat.DISPLAY_DATE)
          return `<b>${params.seriesName ?? ''}</b><br/>${dateLabel}: ${credits} cr`
        },
      },
      grid: {
        show: true,
        width: '100%',
        left: 'left',
        top: 55,
      },
      toolbox: {
        left: 'left',
        feature: {
          dataZoom: {
            yAxisIndex: 'none',
          },
          restore: {},
          saveAsImage: {},
        },
      },
      dataZoom: [
        { type: 'inside', xAxisIndex: 0 },
        { type: 'slider', xAxisIndex: 0 },
      ],
      xAxis: {
        type: 'time',
      },
      yAxis: {
        type: 'value',
        name: 'Credits',
        position: 'right',
        min: 0,
        splitLine: { show: true },
        scale: true,
      },
      series: [...creditPoints, ...studyRightStartMarker],
      animation: true,
    }),
    [chartInstance, creditPoints, studyRightStartMarker]
  )

  const GraphSizeButton = ({ height, label }) => (
    <Button
      color="primary"
      onClick={() => setGraphHeight(height)}
      variant={height === graphHeight ? 'contained' : 'outlined'}
    >
      {label}
    </Button>
  )

  return (
    <>
      <Stack
        direction="row"
        sx={{
          justifyContent: 'space-between',
          mx: '0.5rem',
        }}
      >
        <Stack direction="row" spacing={1}>
          <GraphSizeButton height={400} label="Small" />
          <GraphSizeButton height={INITIAL_GRAPH_HEIGHT} label="Medium" />
          <GraphSizeButton height={900} label="Large" />
          {studyPlanFilter ? (
            <FormControlLabel
              control={
                <Switch checked={cutStudyplanCredits} onChange={e => setCutStudyplanCredits(e.target.checked)} />
              }
              label="Display credits from study right start"
            />
          ) : null}
        </Stack>
        <InfoBox content={populationStatisticsToolTips.creditAccumulation} />
      </Stack>

      <ReactECharts onChartReady={handleChartReady} option={option} style={{ height: graphHeight }} />
    </>
  )
}
