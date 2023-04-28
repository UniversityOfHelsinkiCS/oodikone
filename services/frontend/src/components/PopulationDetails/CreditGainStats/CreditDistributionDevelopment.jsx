import React, { useState, useMemo } from 'react'
import ReactHighcharts from 'react-highcharts'
import { Radio, Dropdown, Segment } from 'semantic-ui-react'
import moment from 'moment'
import _ from 'lodash'
import chroma from 'chroma-js'
import { useLocation } from 'react-router-dom'
import { useGetSemestersQuery } from 'redux/semesters'
import useLanguage from 'components/LanguagePicker/useLanguage'
import { studentNumberFilter } from 'components/FilterView/filters'
import { getTargetCreditsForProgramme } from 'common'
import { getMonths } from '../../../common/query'
import useFilters from '../../FilterView/useFilters'

const StackOrdering = {
  ASCENDING: 'asc',
  DESCENDING: 'desc',
}

const TimeDivision = {
  ACADEMIC_YEAR: 'academic-year',
  CALENDAR_YEAR: 'calendar-year',
  SEMESTER: 'semester',
}

export const getStudentCredits = (student, start, end, cumulative, includeTransferredCredits = true) => {
  const predicate = cumulative ? c => moment(c.date).isBefore(end) : c => moment(c.date).isBetween(start, end)

  const passedCourses = includeTransferredCredits
    ? student.courses.filter(c => c.passed && !c.isStudyModuleCredit && predicate(c))
    : student.courses.filter(c => c.passed && !c.isStudyModuleCredit && predicate(c) && c.credittypecode !== 9)

  return _.sum(_.map(passedCourses, 'credits'))
}

export const splitStudentCredits = (student, timeSlots, cumulative) => {
  if (!timeSlots.length) return {}

  let timeSlotN = 0

  const results = new Array(timeSlots.length).fill(0)

  _.chain(student.courses)
    .filter(c => c.passed && !c.isStudyModuleCredit && moment(c.date).isAfter(timeSlots[0].start))
    .orderBy(c => moment(c.date), ['asc'])
    .forEach(course => {
      while (timeSlotN < timeSlots.length && moment(course.date).isAfter(timeSlots[timeSlotN].end)) {
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

const LIMITS_NON_CUMULATIVE = [15, 30, 45, 60]

const hasGraduatedBefore = (student, programme, date) => {
  const sr = student.studyrights
    .filter(sr => sr.studyright_elements.findIndex(sre => sre.code === programme) > -1)
    .pop()

  if (sr === undefined) {
    return false
  }

  return sr.graduated && moment(date).isAfter(sr.enddate)
}

const GRADUATED = Symbol('GRADUATED')

const getChartData = (students, timeSlots, order, programme, timeDivision, cumulative) => {
  const programmeCredits = getTargetCreditsForProgramme(programme)

  // In calendar-year mode, minus 30 from target credits because programmers (usually) start in autumn,
  // also if current date is before august, minus 30
  const isCalendar = timeDivision === TimeDivision.CALENDAR_YEAR
  const isPastAugust = new Date().getMonth() > 6
  const calendarModifier = 30 + (isPastAugust ? 0 : 30)
  const creditsByTimeslots =
    timeSlots.length * (timeDivision === TimeDivision.SEMESTER ? 30 : 60) - (isCalendar ? calendarModifier : 0)
  const maxCredits = creditsByTimeslots > programmeCredits ? programmeCredits : creditsByTimeslots

  const limitBreaks = cumulative
    ? [1, 2, 3, 4, 5, 6].map(num => Math.round((num * maxCredits) / 6))
    : LIMITS_NON_CUMULATIVE.map(limit => limit * (timeDivision === TimeDivision.SEMESTER ? 0.5 : 1))

  let limits = _.range(0, limitBreaks.length + 1).map(i => [limitBreaks[i - 1], limitBreaks[i]])

  let colors = chroma.scale(['#f8696b', '#f5e984', '#63be7a']).colors(limits.length)

  limits.push(GRADUATED)
  colors.push('#dedede')

  if (order === StackOrdering.ASCENDING) {
    limits = _.reverse(limits)
    colors = _.reverse(colors)
  }

  const data = new Array(limits.length)
    .fill()
    .map(() => new Array(timeSlots.length).fill().map(() => ({ y: 0, custom: { students: [] } })))

  const studentCredits = students.map(s => splitStudentCredits(s, timeSlots, cumulative))

  timeSlots.forEach((slot, timeSlotIndex) => {
    students
      .map((student, i) => [student, i])
      .forEach(([student, studentIndex]) => {
        const hasGraduated = programme && hasGraduatedBefore(student, programme, slot.start)
        const credits = studentCredits[studentIndex][timeSlotIndex]

        const rangeIndex = hasGraduated
          ? limits.indexOf(GRADUATED)
          : limits.findIndex(limit => {
              if (limit === GRADUATED) {
                return false
              }

              const [min, max] = limit

              return (min === undefined || credits > min) && (max === undefined || credits <= max)
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
      name = `${min ?? '0'} - ${max ?? '∞'}`
    }

    return {
      name,
      data: slots,
      color,
    }
  })

  return series
}

function tooltipFormatter() {
  // eslint-disable-next-line
  return `<div style="text-align: center; width: 100%"><b>${this.x}</b>, ${this.series.name}<br/>${this.y}/${this.total} students (${Math.round(this.percentage)}%)</div>`;
}

const CreditDistributionDevelopment = ({ students, query }) => {
  const [cumulative, setCumulative] = useState(true)
  const [timeDivision, setTimeDivision] = useState(TimeDivision.SEMESTER)
  const [stackOrdering, setStackOrdering] = useState(StackOrdering.ASCENDING)
  const months = getMonths(useLocation())
  const semestersQuery = useGetSemestersQuery()
  const { getTextIn } = useLanguage()
  const { filterDispatch } = useFilters()

  const programme = query?.studyRights?.programme

  const timeSlots = useMemo(() => {
    const startDate = moment().subtract({ months }).endOf('year')
    const semesters = semestersQuery.data?.semesters ?? []

    if (timeDivision === TimeDivision.CALENDAR_YEAR) {
      return _.range(moment().year() - Math.ceil(months / 12), moment().year() + 1).map(year => ({
        start: moment({ year }),
        end: moment({ year }).endOf('year'),
        label: year,
      }))
    }

    if (timeDivision === TimeDivision.ACADEMIC_YEAR) {
      return _.chain(semesters)
        .groupBy('yearcode')
        .values()
        .map(([a, b]) => {
          const s = _.sortBy([moment(a.startdate), moment(a.enddate), moment(b.startdate), moment(b.enddate)])
          return [s[0], s[s.length - 1]]
        })
        .filter(([a, b]) => startDate.isBefore(b) && moment().isAfter(a))
        .map(([start, end]) => ({
          start,
          end,
          label: `${start.year()}-${end.year()}`,
        }))
        .value()
    }

    if (timeDivision === TimeDivision.SEMESTER) {
      return Object.values(semesters)
        .filter(s => startDate.isBefore(s.enddate) && moment().isAfter(s.startdate))
        .map(s => ({
          start: s.startdate,
          end: s.enddate,
          label: getTextIn(s.name),
        }))
    }

    return []
  }, [timeDivision, months, semestersQuery, getTextIn])

  const seriesList = useMemo(() => {
    return [
      getChartData(students, timeSlots, stackOrdering, programme, timeDivision, false),
      getChartData(students, timeSlots, stackOrdering, programme, timeDivision, true),
    ]
  }, [students, timeSlots, stackOrdering, programme, timeDivision, cumulative])

  const labels = timeSlots.map(ts => ts.label)
  const series = seriesList[0 + cumulative]

  const config = {
    series,
    title: { text: '' },
    credits: {
      text: 'oodikone | TOSKA',
    },
    tooltip: {
      formatter: tooltipFormatter,
    },
    xAxis: {
      categories: labels,
    },
    yAxis: {
      allowDecimals: false,
      min: 0,
      max: students.length,
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
            click(e) {
              filterDispatch(studentNumberFilter.actions.addToAllowlist(e.point.custom.students))
            },
          },
        },
      },
    },
  }

  return (
    <div>
      <div style={{ textAlign: 'right' }}>
        <Segment.Group horizontal compact style={{ display: 'inline-flex', margin: '0 0 2em 0' }}>
          <Segment>
            <Radio toggle label="Cumulative" checked={cumulative} onChange={() => setCumulative(!cumulative)} />
          </Segment>
          <Segment>
            <label style={{ marginRight: '0.5em' }}>Divide by:</label>
            <Dropdown
              inline
              value={timeDivision}
              onChange={(_evt, { value }) => setTimeDivision(value)}
              label="Divide by"
              options={[
                { value: TimeDivision.CALENDAR_YEAR, text: 'Calendar year' },
                { value: TimeDivision.ACADEMIC_YEAR, text: 'Academic year' },
                { value: TimeDivision.SEMESTER, text: 'Semester' },
              ]}
            />
          </Segment>
          <Segment>
            <label style={{ marginRight: '0.5em' }}>Stack ordering:</label>
            <Dropdown
              inline
              value={stackOrdering}
              onChange={(_evt, { value }) => setStackOrdering(value)}
              options={[
                { value: StackOrdering.ASCENDING, text: 'Ascending' },
                { value: StackOrdering.DESCENDING, text: 'Descending' },
              ]}
            />
          </Segment>
        </Segment.Group>
      </div>
      <ReactHighcharts config={config} />
    </div>
  )
}

export default CreditDistributionDevelopment
