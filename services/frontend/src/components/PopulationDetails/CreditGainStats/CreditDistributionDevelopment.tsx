import Box from '@mui/material/Box'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormLabel from '@mui/material/FormLabel'
import Paper from '@mui/material/Paper'
import RadioMui from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import dayjs, { Dayjs } from 'dayjs'
import ReactECharts from 'echarts-for-react'

import { groupBy } from 'lodash-es'
import { useMemo, useState } from 'react'

import { getCreditCategories, getTargetCreditsForProgramme, TimeDivision } from '@/common'
import { Toggle } from '@/components/common/toggle/Toggle'
import { ToggleContainer } from '@/components/common/toggle/ToggleContainer'
import { studentNumberFilter } from '@/components/FilterView/filters'
import { useFilters } from '@/components/FilterView/useFilters'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { useDeepMemo } from '@/hooks/deepMemo'
import { useSemesters } from '@/hooks/useSemesters'
import { generateGradientColors } from '@/util/color'
import { FormattedStudent } from '@oodikone/shared/types'
import { range } from '@oodikone/shared/util'

const splitStudentCredits = (student: FormattedStudent, timeSlots: any[], cumulative: boolean) => {
  if (!timeSlots.length) return []

  let timeSlotN = 0
  const results: number[] = new Array(timeSlots.length).fill(0)

  student.courses
    .filter(course => course.passed && !course.isStudyModuleCredit && dayjs(course.date).isAfter(timeSlots[0].start))
    .sort((a, b) => Number(dayjs(a.date) > dayjs(b.date)))
    .forEach(course => {
      while (timeSlotN < timeSlots.length && dayjs(course.date).isAfter(timeSlots[timeSlotN].end)) timeSlotN++
      if (timeSlots.length <= timeSlotN) return

      results[timeSlotN] += course.credits
    })

  if (cumulative)
    for (let i = 1; i < timeSlots.length; i++) {
      results[i] += results[i - 1]
    }

  return results
}

const hasGraduatedBeforeDate = (student: FormattedStudent, programme: string, date: Dayjs) => {
  const correctStudyRight = student.studyRights.find(studyRight =>
    studyRight.studyRightElements.some(el => el.code === programme)
  )
  if (!correctStudyRight) return false
  const studyRightElement = correctStudyRight.studyRightElements.find(el => el.code === programme)
  return Boolean(studyRightElement?.graduated && date.isAfter(studyRightElement?.endDate, 'day'))
}

const getChartData = (
  students: FormattedStudent[],
  timeSlots: any[],
  programme: string,
  timeDivision: TimeDivision,
  cumulative: boolean,
  combinedProgramme?: string
) => {
  const programmeCredits = getTargetCreditsForProgramme(programme) + (combinedProgramme ? 180 : 0)

  const limits: Array<number[] | 'Graduated'> = getCreditCategories(
    cumulative,
    timeDivision,
    programmeCredits,
    timeSlots.length,
    6
  )
  const colors = generateGradientColors(limits.length - 1)
  colors.push('#ddd') // Color for graduated (grey)

  const data: { value: number; students: Array<FormattedStudent['studentNumber']> }[][] = limits.map(() =>
    timeSlots.map(() => ({
      value: 0,
      students: [],
    }))
  )

  const studentCredits = students.map(student => splitStudentCredits(student, timeSlots, cumulative))

  timeSlots.forEach((slot, timeSlotIndex) => {
    students.forEach((student, studentIndex) => {
      const hasGraduated = !!programme && hasGraduatedBeforeDate(student, programme, dayjs(slot.end))
      const credits = studentCredits[studentIndex][timeSlotIndex]

      const rangeIndex = hasGraduated
        ? limits.indexOf('Graduated')
        : limits.findIndex(limit => {
            if (limit === 'Graduated') {
              return false
            }

            const [min, max] = limit

            if (min == null) {
              return credits < max
            }
            if (max == null) {
              return credits >= min
            }
            return credits >= min && credits < max
          })

      data[rangeIndex][timeSlotIndex].value += 1
      data[rangeIndex][timeSlotIndex].students.push(student.studentNumber)
    })
  })

  const series = data.map((slots, limitN) => {
    const color = colors[limitN]

    const limit = limits[limitN]
    let name

    if (limit === 'Graduated') {
      name = 'Graduated'
    } else {
      const [min, max] = limit
      if (min == null) {
        name = `Credits < ${max}`
      } else if (max == null) {
        name = `Credits ≥ ${min}`
      } else {
        name = `${min} ≤ credits < ${max}`
      }
    }

    return {
      name,
      data: slots,
      color,
    }
  })

  return series
}

type CreditDistributionDevelopmentProps = {
  filteredStudents: FormattedStudent[]
  programme: string
  combinedProgramme?: string
  year: number
}

export const CreditDistributionDevelopment = ({
  filteredStudents,
  programme,
  combinedProgramme,
  year,
}: CreditDistributionDevelopmentProps) => {
  const [cumulative, setCumulative] = useState(true)
  const [timeDivision, setTimeDivision] = useState<TimeDivision>(TimeDivision.SEMESTER)
  const [isAscending, setIsAscending] = useState(false)

  const { getTextIn } = useLanguage()
  const { filterDispatch } = useFilters()

  const { semesters } = useSemesters()

  const timeSlots = (() => {
    const startDate = dayjs().year(year).endOf('year')

    if (timeDivision === TimeDivision.CALENDAR_YEAR) {
      return range(year, dayjs().year() + 1).map(year => ({
        start: dayjs().year(year),
        end: dayjs().year(year).endOf('year'),
        label: year.toString(),
      }))
    }

    if (timeDivision === TimeDivision.ACADEMIC_YEAR) {
      return Object.values(groupBy(semesters, 'yearcode'))
        .map(([a, b]) => [dayjs(a.startdate), dayjs(b.enddate)])
        .filter(([a, b]) => startDate.isBefore(b) && dayjs().isAfter(a))
        .map(([start, end]) => ({
          start,
          end,
          label: `${start.year()}-${end.year()}`,
        }))
    }

    if (timeDivision === TimeDivision.SEMESTER) {
      return Object.values(semesters)
        .filter(semester => startDate.isBefore(semester.enddate) && dayjs().isAfter(semester.startdate))
        .map(semester => ({
          start: dayjs(semester.startdate),
          end: dayjs(semester.enddate),
          label: getTextIn(semester.name) ?? '',
        }))
    }
    return []
  })()

  const series = useDeepMemo(
    () => getChartData(filteredStudents, timeSlots, programme, timeDivision, cumulative, combinedProgramme),
    [filteredStudents, timeSlots, programme, timeDivision, cumulative, combinedProgramme]
  )

  const labels = timeSlots.map(ts => ts.label)
  const bcMsTitle = combinedProgramme === 'MH90_001' ? 'Bachelor + Licentiate' : 'Bachelor + Master'
  const title = combinedProgramme ? bcMsTitle : ''
  const ascendingSeries = useMemo(() => {
    const graduatedSeries = series.find(seriesItem => seriesItem.name === 'Graduated')
    const nonGraduatedSeries = series.filter(seriesItem => seriesItem.name !== 'Graduated')
    return graduatedSeries ? [...nonGraduatedSeries, graduatedSeries] : nonGraduatedSeries
  }, [series])

  const displayedSeries = useMemo(
    () => (isAscending ? ascendingSeries : ascendingSeries.toReversed()),
    [isAscending, ascendingSeries]
  )

  const option = useMemo(
    () => ({
      title: title
        ? {
            text: title,
            left: 'center',
          }
        : undefined,
      tooltip: {
        trigger: 'item',
        formatter: (params: { name?: string; seriesName?: string; value?: unknown; dataIndex?: number }) => {
          const value =
            typeof params.value === 'number'
              ? params.value
              : Number.isFinite(Number(params.value))
                ? Number(params.value)
                : 0
          const dataIndex = params.dataIndex ?? 0
          const total = displayedSeries.reduce(
            (sum, currentSeries) => sum + (currentSeries.data[dataIndex]?.value ?? 0),
            0
          )
          const percentage = total ? Math.round((value / total) * 100) : 0

          return `<div style="text-align: left; width: 100%"><b>${params.name ?? ''}</b>, ${params.seriesName ?? ''}<br/>${value}/${total} students (${percentage}%)</div>`
        },
      },
      legend: {},
      xAxis: {
        type: 'category',
        data: labels,
      },
      grid: {
        show: false,
        top: 60,
        left: '15%',
        right: '15%',
        bottom: 90,
      },
      toolbox: {
        feature: {
          saveAsImage: {},
          dataView: {
            readOnly: true,
          },
        },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: filteredStudents.length,
        minInterval: 1,
        name: 'Students',
      },
      series: displayedSeries.map(seriesItem => ({
        name: seriesItem.name,
        type: 'bar',
        stack: 'students',
        data: seriesItem.data,
        itemStyle: {
          color: seriesItem.color,
        },
        label: {
          show: true,
          formatter: (params: { value?: unknown }) => {
            const numericValue =
              typeof params.value === 'number'
                ? params.value
                : Number.isFinite(Number(params.value))
                  ? Number(params.value)
                  : 0
            return numericValue ? `${numericValue}` : ''
          },
        },
      })),
      animation: true,
    }),
    [title, labels, filteredStudents.length, displayedSeries]
  )

  const onEvents = useMemo(
    () => ({
      click: (params: { componentType?: string; data?: { students?: Array<FormattedStudent['studentNumber']> } }) => {
        if (params.componentType !== 'series') return
        if (!params.data?.students?.length) return

        filterDispatch(studentNumberFilter.actions.addToAllowlist(params.data.students))
      },
    }),
    [filterDispatch]
  )

  return (
    <Paper sx={{ p: 2, my: 2 }} variant="outlined">
      <Box sx={{ mt: 2, mx: 2, width: '100%', display: 'flex', justifyContent: 'center', gap: '5em' }}>
        <ToggleContainer>
          <FormLabel sx={{ mb: 1 }}>Chart settings</FormLabel>
          <Toggle
            firstLabel="Non-cumulative"
            secondLabel="Cumulative"
            setValue={() => setCumulative(prev => !prev)}
            value={cumulative}
          />
          <Toggle
            firstLabel="Ascending"
            secondLabel="Descending"
            setValue={() => setIsAscending(prev => !prev)}
            value={!isAscending}
          />
        </ToggleContainer>
        <FormControl>
          <FormLabel>Divide by</FormLabel>
          <RadioGroup onChange={(_, value) => setTimeDivision(value as TimeDivision)} value={timeDivision}>
            {Object.values(TimeDivision).map(value => (
              <FormControlLabel control={<RadioMui sx={{ py: '0.5em' }} />} key={value} label={value} value={value} />
            ))}
          </RadioGroup>
        </FormControl>
      </Box>
      <ReactECharts notMerge onEvents={onEvents} option={option} replaceMerge={['series']} style={{ height: 450 }} />
    </Paper>
  )
}
