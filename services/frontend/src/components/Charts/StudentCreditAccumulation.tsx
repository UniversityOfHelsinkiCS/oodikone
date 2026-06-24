import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import ReactECharts from 'echarts-for-react'
import { useMemo, useState } from 'react'

import { getStudyRightElementTargetDates } from '@/common'
import {
  createGoalLineData,
  filterCoursesByStudyPlan,
  getGraduationDataPoints,
  getStudentTransferMarkers,
} from '@/components/Charts/util'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { DateFormat } from '@/constants/date'
import type { Absence } from '@/types/students'
import { reformatDate } from '@/util/timeAndDate'
import { CreditTypeCode } from '@oodikone/shared/types'
import type { StudentPageStudent } from '@oodikone/shared/types/studentData'

const INITIAL_GRAPH_HEIGHT = 700

type StudentCreditAccumulationProps = {
  student: StudentPageStudent
  absences: Absence[]
  startDate: Date
  endDate: number
  studyRightId?: string
  selectedStudyPlan?: {
    programme_code: string
    included_courses: string[]
  }
}

const GraphSizeButton = ({
  graphHeight,
  height,
  label,
  onSelect,
}: {
  graphHeight: number
  height: number
  label: string
  onSelect: (height: number) => void
}) => (
  <Button color="primary" onClick={() => onSelect(height)} variant={height === graphHeight ? 'contained' : 'outlined'}>
    {label}
  </Button>
)

export const StudentCreditAccumulation = ({
  student,
  absences,
  startDate,
  endDate,
  studyRightId,
  selectedStudyPlan,
}: StudentCreditAccumulationProps) => {
  const { getTextIn } = useLanguage()
  const [graphHeight, setGraphHeight] = useState(INITIAL_GRAPH_HEIGHT)
  const hasStudyRights = student.studyRights.length > 0

  const selectedStudyRight = useMemo(
    () => (studyRightId ? student.studyRights.find(studyRight => studyRight.id === studyRightId) : undefined),
    [student.studyRights, studyRightId]
  )

  const earliestStudyRightStart = useMemo(() => {
    const scope = selectedStudyRight ? [selectedStudyRight] : student.studyRights
    const times = scope
      .map(studyRight => new Date(studyRight.startDate).getTime())
      .filter(time => Number.isFinite(time))

    return times.length ? Math.min(...times) : undefined
  }, [selectedStudyRight, student.studyRights])

  const pointData = useMemo(() => {
    const filteredCourses = filterCoursesByStudyPlan(student.courses, selectedStudyPlan)
      .filter(course => new Date(course.date).getTime() <= Date.now())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    let credits = 0
    const points: Array<{ value: [number, number]; tooltipHtml: string }> = []
    const graduationMarkPoints: Array<{ coord: number[]; name: string }> = []

    for (const course of filteredCourses) {
      if (![CreditTypeCode.PASSED, CreditTypeCode.APPROVED].includes(course.credittypecode)) continue

      const gainedCredits = !course.isStudyModuleCredit ? course.credits : 0
      credits += gainedCredits
      const x = new Date(course.date).getTime()
      const y = credits
      const courseCode = course.course?.code
      const courseName = course.course?.name ? getTextIn(course.course.name) : ''
      const tooltipHtml = [
        `<strong>${courseName}${courseCode ? ` (${courseCode})` : ''}</strong>`,
        `Credits: ${course.credits}`,
        `Grade: ${course.grade || '-'}`,
        `Date: ${reformatDate(course.date, DateFormat.DISPLAY_DATE)}`,
        course.isStudyModuleCredit ? '[Study Module]' : '',
      ]
        .filter(Boolean)
        .join('<br/>')

      points.push({
        value: [x, y],
        tooltipHtml,
      })
    }

    const graduationData = (selectedStudyRight ? [selectedStudyRight] : student.studyRights)
      .flatMap(studyRight => studyRight.studyRightElements)
      .filter(element => !!element.graduated)
      .map(element => ({
        date: new Date(element.endDate).getTime(),
        label: `Graduated from ${getTextIn(element.name) ?? ''}`.trim(),
      }))
      .sort((a, b) => a.date - b.date)

    if (points.length) {
      const numericalPoints = points.map(point => [point.value[0], point.value[1]])
      graduationData.forEach(graduation =>
        getGraduationDataPoints(numericalPoints, graduationMarkPoints, graduation.date)
      )

      const pointLookup = new Map(points.map(point => [`${point.value[0]}-${point.value[1]}`, point]))
      const pointsWithGraduationNodes = numericalPoints.map(value => {
        const key = `${value[0]}-${value[1]}`
        return pointLookup.get(key) ?? { value: [value[0], value[1]] as [number, number], tooltipHtml: '' }
      })

      return { points: pointsWithGraduationNodes, graduationMarkPoints, graduationData }
    }

    return { points, graduationMarkPoints, graduationData }
  }, [student, selectedStudyPlan, selectedStudyRight, getTextIn])

  const goalSeries = useMemo(() => {
    const studyRightElement = selectedStudyRight?.studyRightElements.find(
      element => element.code === selectedStudyPlan?.programme_code
    )

    const [targetStart, targetEnd] = getStudyRightElementTargetDates(studyRightElement, absences)
    const graphStart = (targetStart ? new Date(targetStart) : new Date(earliestStudyRightStart ?? startDate)).getTime()
    const graphEnd = (targetEnd ? new Date(targetEnd) : new Date(endDate)).getTime()

    const filteredAbsences = absences.filter(absence => {
      const absenceStart = new Date(absence.startDate).getTime()
      const absenceEnd = new Date(absence.endDate).getTime()
      return absenceStart <= graphEnd && absenceEnd >= graphStart
    })

    return createGoalLineData(graphStart, graphEnd, filteredAbsences)
  }, [selectedStudyRight, selectedStudyPlan, absences, startDate, endDate, earliestStudyRightStart])

  const xAxisMin = useMemo(() => {
    const defaultMin = new Date(startDate).getTime()
    if (!hasStudyRights) return defaultMin

    const goalStart = goalSeries.points[0]?.[0]
    if (typeof goalStart !== 'number' || Number.isNaN(goalStart)) return defaultMin

    return Math.min(defaultMin, goalStart)
  }, [startDate, hasStudyRights, goalSeries.points])

  const transferMarkers = useMemo(
    () => getStudentTransferMarkers(student, text => getTextIn(text as never)),
    [student, getTextIn]
  )

  const yAxisMax = useMemo(() => {
    const studentMax = pointData.points.reduce((max, point) => Math.max(max, point.value[1]), 0)
    const goalMax = hasStudyRights
      ? goalSeries.points.reduce((max, [, credits]) => (Number.isFinite(credits) ? Math.max(max, credits) : max), 0)
      : 0

    const maxCredits = Math.max(studentMax, goalMax)
    if (maxCredits <= 0) return undefined

    return Math.ceil(maxCredits / 10) * 10
  }, [pointData.points, goalSeries.points, hasStudyRights])

  const tooltipsByTimestamp = useMemo(() => {
    const byTimestamp = new Map<number, string[]>()

    for (const point of pointData.points) {
      if (!point.tooltipHtml) continue
      const timestamp = point.value[0]
      const existing = byTimestamp.get(timestamp) ?? []
      existing.push(point.tooltipHtml)
      byTimestamp.set(timestamp, existing)
    }

    return byTimestamp
  }, [pointData.points])

  const option = useMemo(
    () => ({
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'line',
          snap: true,
        },
        formatter: (
          rawParams:
            | {
                seriesName?: string
                data?: { tooltipHtml?: string }
                value?: [number, number]
              }
            | Array<{
                seriesName?: string
                data?: { tooltipHtml?: string }
                value?: [number, number]
              }>
        ) => {
          const params = Array.isArray(rawParams) ? rawParams : [rawParams]

          const timestamp = params.find(param => param.value)?.value?.[0]
          if (typeof timestamp === 'number') {
            const tooltipsAtTimestamp = tooltipsByTimestamp.get(timestamp)
            if (tooltipsAtTimestamp?.length) {
              return tooltipsAtTimestamp.join('<br/><br/>')
            }
          }

          const studentPoint = params.find(param => param.data?.tooltipHtml)
          if (studentPoint?.data?.tooltipHtml) return studentPoint.data.tooltipHtml

          return ''
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
        { type: 'inside', xAxisIndex: [0, 1], filterMode: 'none' },
        { type: 'slider', xAxisIndex: [0, 1], filterMode: 'none' },
      ],
      xAxis: [
        {
          type: 'time',
          min: xAxisMin,
          max: endDate,
        },
        {
          type: 'time',
          min: xAxisMin,
          max: endDate,
          show: false,
          axisPointer: {
            show: false,
          },
        },
      ],
      yAxis: {
        type: 'value',
        name: 'Credits',
        position: 'right',
        min: 0,
        max: yAxisMax,
        splitLine: { show: true },
      },
      series: [
        {
          name: student.studentNumber,
          type: 'line',
          showSymbol: true,
          symbol: 'circle',
          symbolSize: 8,
          smooth: 0.1,
          itemStyle: {
            borderWidth: 2,
          },
          emphasis: {
            focus: 'self',
            scale: true,
            symbol: 'circle',
            symbolSize: 11,
            itemStyle: {
              color: '#1976d2',
              borderColor: '#1976d2',
            },
          },
          data: pointData.points,
          markPoint: pointData.graduationMarkPoints.length
            ? {
                symbol: 'diamond',
                symbolSize: 20,
                data: pointData.graduationMarkPoints,
              }
            : undefined,
        },
        ...(hasStudyRights
          ? [
              {
                name: 'Goal',
                type: 'line',
                xAxisIndex: 1,
                data: goalSeries.points,
                showSymbol: false,
                silent: true,
                tooltip: { show: false },
                lineStyle: {
                  color: '#99d8c4',
                  width: 2,
                },
                markArea: {
                  silent: true,
                  label: {
                    show: true,
                    position: 'insideTop',
                    color: '#1f2937',
                    fontSize: 11,
                    padding: [2, 4],
                    backgroundColor: 'rgba(255, 255, 255, 0.65)',
                    borderRadius: 3,
                  },
                  data: goalSeries.markAreas.map(area => [
                    {
                      name: area.label,
                      xAxis: area.range[0].xAxis,
                      itemStyle: {
                        color: `${area.color}33`,
                        borderColor: area.color,
                        borderType: area.borderType,
                      },
                    },
                    { xAxis: area.range[1].xAxis },
                  ]),
                },
              },
            ]
          : []),
        {
          name: 'Graduations and transfers',
          type: 'line',
          data: [],
          silent: true,
          markLine: {
            silent: true,
            symbol: 'none',
            data: [
              ...transferMarkers.map(marker => ({
                xAxis: marker.value,
                label: {
                  formatter: marker.label,
                  position: 'insideEndTop',
                },
                lineStyle: { color: '#cbd128', type: 'dashed', width: 2 },
              })),
              ...pointData.graduationMarkPoints.map(marker => ({
                xAxis: marker.coord[0],
                label: {
                  formatter:
                    pointData.graduationData.find(graduation => graduation.date === marker.coord[0])?.label ??
                    'Graduation',
                  position: 'insideEndTop',
                },
                lineStyle: { color: '#a333c8', type: 'dashed', width: 2 },
              })),
            ],
          },
        },
      ],
      animation: true,
    }),
    [
      student.studentNumber,
      pointData,
      goalSeries,
      transferMarkers,
      endDate,
      tooltipsByTimestamp,
      hasStudyRights,
      xAxisMin,
      yAxisMax,
    ]
  )

  return (
    <>
      <Stack direction="row" spacing={1} sx={{ mx: '0.5rem' }}>
        <GraphSizeButton graphHeight={graphHeight} height={400} label="Small" onSelect={setGraphHeight} />
        <GraphSizeButton
          graphHeight={graphHeight}
          height={INITIAL_GRAPH_HEIGHT}
          label="Medium"
          onSelect={setGraphHeight}
        />
        <GraphSizeButton graphHeight={graphHeight} height={1000} label="Large" onSelect={setGraphHeight} />
      </Stack>
      <ReactECharts option={option} style={{ height: graphHeight }} />
    </>
  )
}
