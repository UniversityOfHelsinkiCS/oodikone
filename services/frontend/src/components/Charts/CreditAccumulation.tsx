import dayjs from 'dayjs'
import ReactECharts from 'echarts-for-react'
import { useMemo, useState } from 'react'

import { CreditTypeCode, FormattedStudent } from '@oodikone/shared/types'
import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'
import { InfoBox } from '../InfoBox/InfoBoxWithTooltip'
import { populationStatisticsToolTips } from '@/common/InfoToolTips'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import { getGraduationDataPoints, getGraduationsByCodes } from './util'

const INITIAL_GRAPH_HEIGHT = 600

/**
* Credit accumulation graph for **class statistics**
*
* @param students (size must be more than 0)
*/
export const CreditAccumulationGraph = ({ students, programmeCodes, showBachelorAndMaster, studyPlanFilter }: { students: FormattedStudent[], programmeCodes: string[], showBachelorAndMaster: boolean, studyPlanFilter: boolean }) => {

  const [graphHeight, setGraphHeight] = useState(INITIAL_GRAPH_HEIGHT)
  const [cutStudyplanCredits, setCutStudyplanCredits] = useState(false)

  // Is same for all students in a population
  const populationStudyStart = new Date(students[0].studyrightStart).getTime()
  const creditDateThreshold = useMemo(() => studyPlanFilter && !cutStudyplanCredits
    ? Math.min(...students.flatMap(s => s.courses.map(c => new Date(c.date).getTime())))
    : populationStudyStart
    , [studyPlanFilter, cutStudyplanCredits, students, populationStudyStart])

  const studyRightStartMarker = studyPlanFilter ? [{
    name: "Population study start",
    type: "line",

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
        position: 'insideEndTop'
      },
      data: [
        { xAxis: populationStudyStart }
      ],
    }
  }] : []

  const creditPoints = useMemo(() => (
    students.map(student => {
      const studyplan = student.studyplans.find(sp => sp.programme_code === programmeCodes.at(0))

      const courses = student.courses
        .filter((c) => (
          dayjs(c.date).isSameOrAfter(creditDateThreshold) &&
          !c.isStudyModuleCredit &&
          (studyPlanFilter ? studyplan?.included_courses.includes(c.course_code) : true)
        ))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      let credits = 0
      const points: number[][] = []
      const markPointsForStudent: any[] = [];
      const graduations = getGraduationsByCodes(student, programmeCodes, showBachelorAndMaster)

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
        markPoint: markPointsForStudent.length ? {
          symbol: 'diamond',
          symbolSize: 20,
          data: markPointsForStudent
        } : undefined,
        symbolSize: 8,
        data: points,
        smooth: 0.1,
        emphasis: { focus: 'series' },
        sampling: 'lttb',
      }
    })
  ), [creditDateThreshold, students, studyPlanFilter])

  const option = useMemo(() => (
    {
      tooltip: {
        trigger: 'axis',
        valueFormatter: (val: number) => `${val} cr`,
        axisPointer: {
          type: 'cross',
          snap: true,
        },
      },
      grid: {
        show: true,
        width: '100%',
        left: "left",
        top: 55,
      },
      toolbox: {
        left: 'left',
        feature: {
          dataZoom: {
            yAxisIndex: "none",
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
    }
  ), [creditPoints, studyRightStartMarker])

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
        <Stack direction="row" spacing={1} >
          <GraphSizeButton height={400} label='Small' />
          <GraphSizeButton height={INITIAL_GRAPH_HEIGHT} label='Medium' />
          <GraphSizeButton height={900} label='Large' />
          {studyPlanFilter && (
            <FormControlLabel
              control={<Switch checked={cutStudyplanCredits} onChange={(e) => setCutStudyplanCredits(e.target.checked)} />}
              label="Display credits from study right start"
            />
          )}
        </Stack>
        <InfoBox content={populationStatisticsToolTips.creditAccumulation} />
      </Stack>

      <ReactECharts option={option} style={{ height: graphHeight }} />
    </>
  )
}

