import React from 'react'
import { Radio } from 'semantic-ui-react'
import createFilter from './createFilter'

const HopsFilterCard = ({ options, onOptionsChange }) => {
  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: '1em', cursor: 'pointer' }}
      onClick={() => {
        onOptionsChange({ active: !options.active })
      }}
    >
      <Radio style={{ width: '3.5rem', flexShrink: 0 }} toggle checked={options.active} />
      <div>Show only credits included in study plan</div>
    </div>
  )
}

export default createFilter({
  key: 'hops',

  title: 'HOPS',

  priority: 100,

  defaultOptions: {
    active: false,
  },

  isActive: ({ active }) => active,

  filter: (student, { active }, { args }) => {
    const hops = student.studyplans.find(plan => plan.programme_code === args.programmeCode)
    const courses = new Set(hops ? hops.included_courses : [])

    const hopsCourses = student.courses.filter(course => courses.has(course.course_code))

    if (active) {
      student.courses = hopsCourses
      student.credits = student.hopsCredits
    }

    return true
  },

  actions: {
    toggle: options => {
      options.active = !options.active
    },
  },

  component: HopsFilterCard,
})
