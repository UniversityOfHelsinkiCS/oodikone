import dayjs from 'dayjs'
import ReactECharts from 'echarts-for-react'
import { useMemo, useState } from 'react'

import { CreditTypeCode, FormattedStudent } from '@oodikone/shared/types'
import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'
import { InfoBox } from '../InfoBox/InfoBoxWithTooltip'
import { populationStatisticsToolTips } from '@/common/InfoToolTips'

const INITIAL_GRAPH_HEIGHT = 600

/**
* Credit accumulation graph for **class statatistics**
*/
export const CreditAccumulationGraph = ({ students }: { students: FormattedStudent[] }) => {

  const [graphHeight, setGraphHeight] = useState(INITIAL_GRAPH_HEIGHT);

  const series = useMemo(() => (
    students.map(student => {
      const courses = student.courses
        .filter((c) => dayjs(c.date).isSameOrAfter(student.studyrightStart) && !c.isStudyModuleCredit)
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
  ), [students])

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
      series,
      animation: true,
    }
  ), [series])

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

        <InfoBox content={populationStatisticsToolTips.creditAccumulation} />
      </Stack>

      <ReactECharts option={option} style={{ height: graphHeight }} />
    </>
  )
}

