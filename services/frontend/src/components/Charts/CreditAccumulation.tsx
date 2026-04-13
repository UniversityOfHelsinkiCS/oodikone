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

const INITIAL_GRAPH_HEIGHT = 600

/**
* Credit accumulation graph for **class statatistics**
*/
export const CreditAccumulationGraph = ({ students, studyPlanFilter }: { students: FormattedStudent[], studyPlanFilter: boolean }) => {
  const [graphHeight, setGraphHeight] = useState(INITIAL_GRAPH_HEIGHT)
  const [cutStudyplanCredits, setCutStudyplanCredits] = useState(false)

  const populationStudyStart = new Date(students[0].studyrightStart).getTime()
  const creditDateThreshold = studyPlanFilter && !cutStudyplanCredits
    ? Math.min(...students.flatMap(s => s.courses.map(c => new Date(c.date).getTime())))
    : populationStudyStart


  const studyRightStartMarker = studyPlanFilter ? [{
    name: "Population study start",
    type: "line",

    markLine: {
      silent: true, // Ignore mouse events
      symbol: 'none', // Disable default arrow shape
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

  const series = useMemo(() => (
    students.map(student => {
      const courses = student.courses
        .filter((c) => dayjs(c.date).isSameOrAfter(creditDateThreshold) && !c.isStudyModuleCredit)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      let credits = 0
      const points: [number, number][] = []

      for (const c of courses) {
        if (c.credittypecode === CreditTypeCode.PASSED || c.credittypecode === CreditTypeCode.APPROVED) {
          credits += c.credits
          points.push([new Date(c.date).getTime(), credits])
        }
      }

      return {
        name: student.studentNumber,
        type: 'line',
        showSymbol: false,
        data: points,
        smooth: 0.1,
        emphasis: { focus: 'series' },
        sampling: 'lttb',
      }
    })
  ), [creditDateThreshold, students])

  const option = useMemo(() => (
    {
      tooltip: {
        trigger: 'axis',
        type: 'shadow',
        axisPointer: {
          animation: false,
          snap: true,
          type: 'cross',
        },
        valueFormatter: (val: number) => `${val} cr`,
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
      series: [...series, ...studyRightStartMarker],
      animation: true,
    }
  ), [series, studyRightStartMarker])

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
        </Stack>
        {studyPlanFilter && (
          <FormControlLabel
            control={<Switch checked={cutStudyplanCredits} onChange={(e) => setCutStudyplanCredits(e.target.checked)} />}
            label="Display credits from study right start"
          />
        )}
        <InfoBox content={populationStatisticsToolTips.creditAccumulation} />
      </Stack>

      <ReactECharts option={option} style={{ height: graphHeight }} />
    </>
  )
}

