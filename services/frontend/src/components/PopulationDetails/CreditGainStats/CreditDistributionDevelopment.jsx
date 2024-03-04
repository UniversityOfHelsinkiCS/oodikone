import _ from 'lodash'
import moment from 'moment'
import React, { useState, useMemo } from 'react'
import ReactHighcharts from 'react-highcharts'
import { useLocation } from 'react-router-dom'
import { Radio, Dropdown, Segment } from 'semantic-ui-react'

import { getTargetCreditsForProgramme, TimeDivision, getCreditCategories, generateGradientColors } from '@/common'
import { getMonths } from '@/common/query'
import { studentNumberFilter } from '@/components/FilterView/filters'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { useGetSemestersQuery } from '@/redux/semesters'
import { useFilters } from '../../FilterView/useFilters'

const StackOrdering = {
  ASCENDING: 'asc',
  DESCENDING: 'desc',
}

const splitStudentCredits = (student, timeSlots, cumulative) => {
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

const hasGraduatedAfter = (student, programme, slot) => {
  const sr = student.studyrights
    .filter(sr => sr.studyright_elements.findIndex(sre => sre.code === programme) > -1)
    .pop()
  if (sr === undefined) {
    return false
  }
  return sr.graduated && (moment(slot.end).isAfter(sr.enddate) || moment(sr.enddate).isBetween(slot.start, slot.end))
}

const GRADUATED = Symbol('GRADUATED')

const getChartData = (students, timeSlots, order, programme, timeDivision, cumulative, combinedProgramme) => {
  const programmeCredits = getTargetCreditsForProgramme(programme) + (combinedProgramme ? 180 : 0)

  let limits = getCreditCategories(cumulative, timeDivision, programmeCredits, timeSlots, 6)
  let colors = generateGradientColors(limits.length)

  limits.push(GRADUATED)
  colors.push('#dedede') // grey

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
        const hasGraduated = programme && hasGraduatedAfter(student, programme, slot)
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
  return `<div style="text-align: center; width: 100%"><b>${this.x}</b>, ${this.series.name}<br/>${this.y}/${
    this.total
  } students (${Math.round(this.percentage)}%)</div>`
}

export const CreditDistributionDevelopment = ({ students, programme, combinedProgramme, year }) => {
  const [cumulative, setCumulative] = useState(true)
  const [timeDivision, setTimeDivision] = useState(TimeDivision.SEMESTER)
  const [stackOrdering, setStackOrdering] = useState(StackOrdering.ASCENDING)
  const months = getMonths(useLocation())
  const semestersQuery = useGetSemestersQuery()
  const { getTextIn } = useLanguage()
  const { filterDispatch } = useFilters()
  const timeSlots = useMemo(() => {
    const startDate = year ? moment([year]).endOf('year') : moment().subtract({ months }).endOf('year')
    const semesters = semestersQuery.data?.semesters ?? []

    if (timeDivision === TimeDivision.CALENDAR_YEAR) {
      const startYear = months === undefined ? year : moment().year() - Math.ceil(months / 12)
      return _.range(startYear, moment().year() + 1).map(year => ({
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
  }, [timeDivision, months, year, semestersQuery, getTextIn])

  const seriesList = useMemo(() => {
    return [
      getChartData(students, timeSlots, stackOrdering, programme, timeDivision, false, combinedProgramme),
      getChartData(students, timeSlots, stackOrdering, programme, timeDivision, true, combinedProgramme),
    ]
  }, [students, timeSlots, stackOrdering, programme, timeDivision, cumulative])

  const labels = timeSlots.map(ts => ts.label)
  const series = seriesList[0 + cumulative]
  const bcMsTitle = combinedProgramme === 'MH90_001' ? 'Bachelor + Licentiate' : 'Bachelor + Master'
  const title = combinedProgramme ? bcMsTitle : ''
  const config = {
    series,
    title: { text: title },
    credits: {
      href: 'https://toska.dev',
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
