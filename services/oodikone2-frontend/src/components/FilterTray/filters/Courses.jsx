import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { Form, Dropdown } from 'semantic-ui-react'
import { createStore, useStore } from 'react-hookstore'
import FilterCard from './common/FilterCard'

const mockOptions = [
  {
    key: 'asd1',
    text: 'Tietorakenteet ja algoritmit',
    value: '1'
  },
  {
    key: 'asd2',
    text: 'Ohjelmoinnin peruskurssi',
    value: '2'
  },
  {
    key: 'asd3',
    text: 'Ohjelmoinnin jatkokurssi',
    value: '3'
  }
]

export const dataStoreName = 'courseFilterDataStore'
createStore(dataStoreName, [])

const Courses = ({ filterControl }) => {
  const [courseStats] = useStore(dataStoreName)
  console.log(courseStats)

  // Wrestle course stats into something semantic-ui eats without throwing up.
  const options = courseStats
    .filter(course => course.stats.students > Math.round(filterControl.filteredStudents.length * 0.3))
    .map(stat => ({
      key: `course-filter-option-${stat.course.code}`,
      text: stat.course.name.fi,
      value: stat.course.code
    }))
  console.log(options)

  return (
    <FilterCard title="Courses">
      <Form>
        <Dropdown options={options} placeholder="Select A Course" selection className="mini" fluid button />
      </Form>
    </FilterCard>
  )
}

export default Courses
