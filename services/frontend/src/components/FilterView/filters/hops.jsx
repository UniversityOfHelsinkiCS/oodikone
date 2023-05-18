import React from 'react'
import { Radio, Button } from 'semantic-ui-react'
import useFilters from 'components/FilterView/useFilters'
import moment from 'moment'
import createFilter from './createFilter'
import creditDateFilter, { selectedStartDate } from './date'

const HopsFilterCard = ({ options, onOptionsChange }) => {
  const { filterDispatch, useFilterSelector } = useFilters()
  const selectedCreditStartDate = useFilterSelector(selectedStartDate(''))

  return (
    <div>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '1em', cursor: 'pointer' }}
        onClick={() => {
          if (
            selectedCreditStartDate &&
            options.studyStart &&
            options.clearCreditDate &&
            new Date(selectedCreditStartDate) > new Date(options.studyStart) &&
            !options.active
          )
            filterDispatch(
              creditDateFilter.actions.setOptions({
                startDate: null,
                endDate: null,
              })
            )
          onOptionsChange({ ...options, active: !options.active })
        }}
      >
        <Radio style={{ width: '3.5rem', flexShrink: 0 }} toggle checked={options.active} />
        <div>Show only credits included in study plan</div>
      </div>
      {options.studyStart ? (
        <Button
          content="Cut credits to study start"
          onClick={() =>
            filterDispatch(
              creditDateFilter.actions.setOptions({
                startDate: moment(options.studyStart),
                endDate: null,
              })
            )
          }
          disabled={!options.active}
          className="credit-date-filter-input"
          size="mini"
          style={{
            margin: '0.5rem',
            whiteSpace: 'nowrap',
          }}
        />
      ) : null}
    </div>
  )
}

export default createFilter({
  key: 'hops',

  title: 'Personal Study Plan',

  priority: -200,

  defaultOptions: {
    active: false,
  },

  isActive: arg => arg?.active,

  filter: (student, { active }, { args }) => {
    const { studyrightStart, studyplans } = student
    const studyrightStartDate = new Date(studyrightStart)
    const studyrights = student.studyrights.filter(sr => !sr.cancelled)?.map(sr => sr.studyrightid)
    const hops = studyplans.find(
      plan => plan.programme_code === args.programmeCode && studyrights.includes(plan.studyrightid)
    )

    if (active) {
      if (!hops) {
        student.courses = []
        student.credits = 0
        return true
      }
      const courses = new Set(hops ? hops.included_courses : [])
      const hopsCourses = student.courses.filter(course => courses.has(course.course_code))
      student.courses = hopsCourses
      student.credits = hops.completed_credits
      return true
    }
    const courses = student.courses.filter(({ date }) => new Date(date) >= studyrightStartDate)
    student.courses = courses
    return true
  },

  actions: {
    toggle: options => {
      options.active = !options.active
    },
  },

  component: HopsFilterCard,
})
