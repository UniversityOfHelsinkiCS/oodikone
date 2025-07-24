import Box from '@mui/material/Box'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormLabel from '@mui/material/FormLabel'
import Paper from '@mui/material/Paper'
import RadioMui from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import dayjs from 'dayjs'
import { Options } from 'highcharts'
import accessibility from 'highcharts/modules/accessibility'
import exportData from 'highcharts/modules/export-data'
import exporting from 'highcharts/modules/exporting'

import { chain, range, sortBy } from 'lodash'
import { useState } from 'react'
import ReactHighcharts from 'react-highcharts'

import { getCreditCategories, getTargetCreditsForProgramme, TimeDivision } from '@/common'
import { studentNumberFilter } from '@/components/FilterView/filters'
import { useFilters } from '@/components/FilterView/useFilters'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { Toggle } from '@/components/material/Toggle'
import { ToggleContainer } from '@/components/material/ToggleContainer'
import { useDeepMemo } from '@/hooks/deepMemo'
import { SemestersData, useGetSemestersQuery } from '@/redux/semesters'
import { generateGradientColors } from '@/util/color'

exporting(ReactHighcharts.Highcharts)
exportData(ReactHighcharts.Highcharts)
accessibility(ReactHighcharts.Highcharts)

/*
This file is bit of a legacy mess still and imo not worth the effort refactoring unless replacing legacy react-highcharts
(last publish 6 years ago as of 2025 btw) with the official newer version or something else entirely
*/
const splitStudentCredits = (student, timeSlots, cumulative) => {
  if (!timeSlots.length) return {}

  let timeSlotN = 0

  const results = new Array(timeSlots.length).fill(0)

  chain(student.courses)
    .filter(course => course.passed && !course.isStudyModuleCredit && dayjs(course.date).isAfter(timeSlots[0].start))
    .orderBy(course => dayjs(course.date), ['asc'])
    .forEach(course => {
      while (timeSlotN < timeSlots.length && dayjs(course.date).isAfter(timeSlots[timeSlotN].end)) {
        timeSlotN++
      }

      if (timeSlotN >= timeSlots.length) {
        return
      }

      results[timeSlotN] += course.credits

      if (cumulative) {
        for (let i = timeSlotN + 1; i < timeSlots.length; i++) {
          results[i] += course.credits
        }
      }
    })
    .value()

  return results
}

const hasGraduatedBeforeDate = (student, programme, date) => {
  const correctStudyRight = student.studyRights.find(studyRight =>
    studyRight.studyRightElements.some(el => el.code === programme)
  )
  if (!correctStudyRight) return false
  const studyRightElement = correctStudyRight.studyRightElements.find(el => el.code === programme)
  return studyRightElement.graduated && date.isAfter(studyRightElement.endDate, 'day')
}

const GRADUATED = Symbol('GRADUATED')

const getChartData = (
  students: any[],
  timeSlots: any[],
  programme: string,
  timeDivision: string,
  cumulative: boolean,
  combinedProgramme?: string
) => {
  const programmeCredits = getTargetCreditsForProgramme(programme) + (combinedProgramme ? 180 : 0)

  const limits: Array<number[] | typeof GRADUATED> = getCreditCategories(
    cumulative,
    timeDivision,
    programmeCredits,
    timeSlots,
    6
  )
  const colors = generateGradientColors(limits.length)

  limits.push(GRADUATED)
  colors.push('#ddd') // Color for graduated (grey)

  const data: { y: number; custom: { students: number[] } }[][] = limits.map(() =>
    timeSlots.map(() => ({
      y: 0,
      custom: { students: [] },
    }))
  )

  const studentCredits = students.map(student => splitStudentCredits(student, timeSlots, cumulative))

  timeSlots.forEach((slot, timeSlotIndex) => {
    students
      .map((student, i) => [student, i])
      .forEach(([student, studentIndex]) => {
        const hasGraduated = programme && hasGraduatedBeforeDate(student, programme, dayjs(slot.end))
        const credits = studentCredits[studentIndex][timeSlotIndex]

        const rangeIndex = hasGraduated
          ? limits.indexOf(GRADUATED)
          : limits.findIndex(limit => {
              if (limit === GRADUATED) {
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

        data[rangeIndex][timeSlotIndex].y += 1
        data[rangeIndex][timeSlotIndex].custom.students.push(student.studentNumber)
      })
  })

  const series = data.map((slots, limitN) => {
    const color = colors[limitN]

    const limit = limits[limitN]
    let name

    if (limit === GRADUATED) {
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
  filteredStudents: any[] // TODO: type
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
  const [timeDivision, setTimeDivision] = useState<(typeof TimeDivision)[keyof typeof TimeDivision]>(
    TimeDivision.SEMESTER
  ) // TODO: use enum or something else
  const [isAscending, setIsAscending] = useState(true)

  const { getTextIn } = useLanguage()
  const { filterDispatch } = useFilters()

  const { data: semesters } = useGetSemestersQuery()
  const { semesters: allSemesters } = semesters ?? { semesters: {} as SemestersData['semesters'] }

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
      return chain(allSemesters)
        .groupBy('yearcode')
        .values()
        .map(([a, b]) => {
          const s = sortBy([dayjs(a.startdate), dayjs(a.enddate), dayjs(b.startdate), dayjs(b.enddate)])
          return [s[0], s[s.length - 1]]
        })
        .filter(([a, b]) => startDate.isBefore(b) && dayjs().isAfter(a))
        .map(([start, end]) => ({
          start,
          end,
          label: `${start.year()}-${end.year()}`,
        }))
        .value()
    }

    if (timeDivision === TimeDivision.SEMESTER) {
      return Object.values(allSemesters)
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

  const config: Options = {
    series: isAscending ? series : series.toReversed(),
    title: { text: title },
    tooltip: {
      formatter() {
        // Highcharts formatter only accepts a subset of HTML as a string
        // eslint-disable-next-line react/no-this-in-sfc
        return `<div style="text-align: center; width: 100%"><b>${this.x}</b>, ${this.series.name}<br/>${this.y}/${this.total} students (${Math.round(this.percentage)}%)</div>`
      },
    },
    xAxis: {
      categories: labels,
    },
    yAxis: {
      allowDecimals: false,
      min: 0,
      max: filteredStudents.length,
      endOnTick: false,
      reversed: false,
      title: { text: 'Students' },
    },
    chart: {
      type: 'column',
      height: '450px',
    },
    plotOptions: {
      column: {
        stacking: 'normal',
        dataLabels: {
          enabled: true,
        },
      },
      series: {
        cursor: 'pointer',
        point: {
          events: {
            click(event) {
              const point = event.point as Highcharts.Point & { custom: { students: number[] } }
              filterDispatch(studentNumberFilter.actions.addToAllowlist(point.custom.students))
            },
          },
        },
      },
    },
  }

  return (
    <Paper sx={{ p: 2, my: 2 }} variant="outlined">
      <Box sx={{ m: 2, width: '100%', display: 'flex', justifyContent: 'center', gap: '5em' }}>
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
            value={isAscending}
          />
        </ToggleContainer>
        <FormControl>
          <FormLabel>Divide by</FormLabel>
          <RadioGroup onChange={(_, value) => setTimeDivision(value)} value={timeDivision}>
            {Object.values(TimeDivision).map(value => (
              <FormControlLabel control={<RadioMui sx={{ py: '0.5em' }} />} key={value} label={value} value={value} />
            ))}
          </RadioGroup>
        </FormControl>
      </Box>
      <ReactHighcharts config={config} />
    </Paper>
  )
}
