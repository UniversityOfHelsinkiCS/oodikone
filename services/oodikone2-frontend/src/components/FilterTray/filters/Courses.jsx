import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { Form, Dropdown } from 'semantic-ui-react'
import { createStore, useStore } from 'react-hookstore'
import FilterCard from './common/FilterCard'

export const dataStoreName = 'courseFilterDataStore'
createStore(dataStoreName, [])

const Courses = ({ filterControl }) => {
  const [courseStats] = useStore(dataStoreName)
  const [selectedCourses, setSelectedCourses] = useState([])

  const onChange = (_, { value }) =>
    setSelectedCourses(prev => prev.concat(courseStats.find(course => course.course.code === value)))

  // Wrestle course stats into something semantic-ui eats without throwing up.
  const options = courseStats
    .filter(course => course.stats.students > Math.round(filterControl.filteredStudents.length * 0.3))
    .filter(course => !selectedCourses.includes(course))
    .map(course => ({
      key: `course-filter-option-${course.course.code}`,
      text: course.course.name.fi,
      value: course.course.code
    }))

  return (
    <FilterCard title="Courses">
      <Form>
        {selectedCourses.map(course => (
          <div key={`course-filter-selected-course-${course.course.code}`}>{course.course.name.fi}</div>
        ))}
        <Dropdown
          options={options}
          placeholder="Select A Course"
          selection
          className="mini"
          fluid
          button
          value=""
          onChange={onChange}
        />
      </Form>
    </FilterCard>
  )
}

Courses.propTypes = {
  filterControl: PropTypes.shape({
    filteredStudents: PropTypes.arrayOf(PropTypes.object).isRequired
  }).isRequired
}

export default Courses
