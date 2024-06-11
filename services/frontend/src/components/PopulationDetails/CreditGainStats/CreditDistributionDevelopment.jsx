import accessibility from 'highcharts/modules/accessibility'
import exportData from 'highcharts/modules/export-data'
import exporting from 'highcharts/modules/exporting'
import _ from 'lodash'
import moment from 'moment'
import qs from 'query-string'
import { useState } from 'react'
import ReactHighcharts from 'react-highcharts'
import { useLocation } from 'react-router-dom'
import { Dropdown, Radio, Segment } from 'semantic-ui-react'

import { generateGradientColors, getCreditCategories, getTargetCreditsForProgramme, TimeDivision } from '@/common'
import { useDeepMemo } from '@/common/hooks'
import { studentNumberFilter } from '@/components/FilterView/filters'
import { useFilters } from '@/components/FilterView/useFilters'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { useGetSemestersQuery } from '@/redux/semesters'

exporting(ReactHighcharts.Highcharts)
exportData(ReactHighcharts.Highcharts)
accessibility(ReactHighcharts.Highcharts)

const StackOrdering = {
  ASCENDING: 'asc',
  DESCENDING: 'desc',
}

const splitStudentCredits = (student, timeSlots, cumulative) => {
  if (!timeSlots.length) return {}

  let timeSlotN = 0

  const results = new Array(timeSlots.length).fill(0)

  _.chain(student.courses)
    .filter(course => course.passed && !course.isStudyModuleCredit && moment(course.date).isAfter(timeSlots[0].start))
    .orderBy(course => moment(course.date), ['asc'])
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
  const studyright = student.studyrights
    .filter(studyright => studyright.studyright_elements.findIndex(element => element.code === programme) > -1)
    .pop()
  if (studyright === undefined) {
    return false
  }
  return (
    studyright.graduated &&
    (moment(slot.end).isAfter(studyright.enddate) || moment(studyright.enddate).isBetween(slot.start, slot.end))
  )
}

const GRADUATED = Symbol('GRADUATED')

const getChartData = (students, timeSlots, programme, timeDivision, cumulative, combinedProgramme) => {
  const programmeCredits = getTargetCreditsForProgramme(programme) + (combinedProgramme ? 180 : 0)

  const limits = getCreditCategories(cumulative, timeDivision, programmeCredits, timeSlots, 6)
  const colors = generateGradientColors(limits.length)

  limits.push(GRADUATED)
  colors.push('#dedede') // grey

  const data = new Array(limits.length)
    .fill()
    .map(() => new Array(timeSlots.length).fill().map(() => ({ y: 0, custom: { students: [] } })))

  const studentCredits = students.map(student => splitStudentCredits(student, timeSlots, cumulative))

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

export const CreditDistributionDevelopment = ({ students, programme, combinedProgramme, year }) => {
  const [cumulative, setCumulative] = useState(true)
  const [timeDivision, setTimeDivision] = useState(TimeDivision.SEMESTER)
  const [stackOrdering, setStackOrdering] = useState(StackOrdering.ASCENDING)
  const location = useLocation()
  const { months } = qs.parse(location.search)
  const { data: semestersAndYears = {} } = useGetSemestersQuery()
  const { semesters = {} } = semestersAndYears
  const { getTextIn } = useLanguage()
  const { filterDispatch } = useFilters()
  const timeSlots = (() => {
    const startDate = year ? moment([year]).endOf('year') : moment().subtract({ months }).endOf('year')

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
        .filter(semester => startDate.isBefore(semester.enddate) && moment().isAfter(semester.startdate))
        .map(semester => ({
          start: semester.startdate,
          end: semester.enddate,
          label: getTextIn(semester.name),
        }))
    }

    return []
  })()

  const series = useDeepMemo(
    () => getChartData(students, timeSlots, programme, timeDivision, cumulative, combinedProgramme),
    [students, timeSlots, programme, timeDivision, cumulative, combinedProgramme]
  )

  const labels = timeSlots.map(ts => ts.label)
  const bcMsTitle = combinedProgramme === 'MH90_001' ? 'Bachelor + Licentiate' : 'Bachelor + Master'
  const title = combinedProgramme ? bcMsTitle : ''
  const config = {
    series: stackOrdering === StackOrdering.ASCENDING ? series.toReversed() : series,
    title: { text: title },
    credits: {
      enabled: false,
    },
    tooltip: {
      formatter() {
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
        animation: false,
        point: {
          events: {
            click(event) {
              filterDispatch(studentNumberFilter.actions.addToAllowlist(event.point.custom.students))
            },
          },
        },
      },
    },
  }

  return (
    <div>
      <div style={{ textAlign: 'right' }}>
        <Segment.Group compact horizontal style={{ display: 'inline-flex', margin: '0 0 2em 0' }}>
          <Segment>
            <Radio checked={cumulative} label="Cumulative" onChange={() => setCumulative(!cumulative)} toggle />
          </Segment>
          <Segment>
            <label style={{ marginRight: '0.5em' }}>Divide by:</label>
            <Dropdown
              inline
              label="Divide by"
              onChange={(_event, { value }) => setTimeDivision(value)}
              options={[
                { value: TimeDivision.CALENDAR_YEAR, text: 'Calendar year' },
                { value: TimeDivision.ACADEMIC_YEAR, text: 'Academic year' },
                { value: TimeDivision.SEMESTER, text: 'Semester' },
              ]}
              value={timeDivision}
            />
          </Segment>
          <Segment>
            <label style={{ marginRight: '0.5em' }}>Stack ordering:</label>
            <Dropdown
              inline
              onChange={(_event, { value }) => setStackOrdering(value)}
              options={[
                { value: StackOrdering.ASCENDING, text: 'Ascending' },
                { value: StackOrdering.DESCENDING, text: 'Descending' },
              ]}
              value={stackOrdering}
            />
          </Segment>
        </Segment.Group>
      </div>
      <ReactHighcharts config={config} />
    </div>
  )
}
