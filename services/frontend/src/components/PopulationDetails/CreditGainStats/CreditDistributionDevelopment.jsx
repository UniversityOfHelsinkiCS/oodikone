import React, { useState, useMemo } from 'react'
import ReactHighcharts from 'react-highcharts'
import { Radio, Dropdown, Segment } from 'semantic-ui-react'
import moment from 'moment'
import _ from 'lodash'
import chroma from 'chroma-js'
import { useLocation } from 'react-router-dom'
import { useGetSemestersQuery } from 'redux/semesters'
import useLanguage from 'components/LanguagePicker/useLanguage'
import { getMonths } from '../../../common/query'

export const getStudentCredits = (student, start, end, cumulative, includeTransferredCredits = true) => {
  const predicate = cumulative ? c => moment(c.date).isBefore(end) : c => moment(c.date).isBetween(start, end)

  const passedCourses = includeTransferredCredits
    ? student.courses.filter(c => c.passed && !c.isStudyModuleCredit && predicate(c))
    : student.courses.filter(c => c.passed && !c.isStudyModuleCredit && predicate(c) && c.credittypecode !== 9)

  return _.sum(_.map(passedCourses, 'credits'))
}

export const splitStudentCredits = (student, timeSlots, cumulative) => {
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

const getChartData = (students, targetCreditCount, timeSlots, cumulative) => {
  const limits = _.range(0, 6).map((_, i, list) => [
    (targetCreditCount / 4) * i,
    list.length === i + 1 ? undefined : (targetCreditCount / 4) * (i + 1),
  ])

  const data = new Array(limits.length).fill().map(() => new Array(timeSlots.length).fill(0))

  students
    .map(s => splitStudentCredits(s, timeSlots, cumulative))
    .forEach(timeSlotCredits => {
      timeSlotCredits.forEach((credits, timeSlotN) => {
        const rangeN = limits.findIndex(([min, max]) => credits >= min && (max === undefined || credits < max))

        data[rangeN][timeSlotN] += 1
      })
    })

  const colors = chroma.scale('YlGn').padding([0.3, 0]).colors(limits.length)

  const labels = _.map(timeSlots, 'label')

  const series = data.map((slots, limitN) => {
    const [min, max] = limits[limitN]

    return {
      name: `${min ?? '0'} - ${max ?? '∞'}`,
      data: slots,
      color: colors[limitN],
    }
  })

  return [labels, series]
}

const CreditDistributionDevelopment = ({ students }) => {
  const [cumulative, setCumulative] = useState(false)
  const [timeDivision, setTimeDivision] = useState('school-year')
  const months = getMonths(useLocation())
  const semestersQuery = useGetSemestersQuery()
  const { getTextIn } = useLanguage()

  const timeSlots = useMemo(() => {
    const startDate = moment().subtract({ months }).endOf('year')
    const semesters = semestersQuery.data?.semesters ?? []

    if (timeDivision === 'calendar-year') {
      return _.range(moment().year() - Math.ceil(months / 12), moment().year() + 1).map(year => ({
        start: moment({ year }),
        end: moment({ year }).endOf('year'),
        label: year,
      }))
    }
    if (timeDivision === 'school-year') {
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
    if (timeDivision === 'semester') {
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
    let target = 0

    if (cumulative) {
      target = months * (60 / 12)
    } else if (timeDivision === 'semester') {
      target = 30
    } else {
      target = 60
    }

    return [getChartData(students, target, timeSlots, false), getChartData(students, target, timeSlots, true)]
  }, [students, cumulative, months, timeSlots, timeDivision])

  const [labels, series] = seriesList[0 + cumulative]

  const config = {
    series,
    title: { text: '' },
    credits: {
      text: 'oodikone | TOSKA',
    },
    xAxis: {
      categories: labels,
    },
    yAxis: {
      allowDecimals: false,
      min: 0,
      reversed: false,
      title: '',
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
                { value: 'calendar-year', text: 'Calendar year' },
                { value: 'school-year', text: 'School year' },
                { value: 'semester', text: 'Semester' },
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
