// TODO: Remove hardcoded language-specific keys.
import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { Form, Dropdown, Card } from 'semantic-ui-react'
import { createStore, useStore } from 'react-hookstore'
import FilterCard from '../common/FilterCard'
import CourseCard from './CourseCard'

export const dataStoreName = 'courseFilterDataStore'
createStore(dataStoreName, [])

const Courses = ({ filterControl }) => {
  const [courseStats] = useStore(dataStoreName)
  const [selectedCourses, setSelectedCourses] = useState([])

  const onChange = (_, { value }) =>
    setSelectedCourses(prev => prev.concat(courseStats.find(course => course.course.code === value[0])))

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
        <Card.Group>
          {selectedCourses.map(course => (
            <CourseCard course={course.course} key={`course-filter-selected-course-${course.course.code}`} />
          ))}
        </Card.Group>
        <Dropdown
          options={options}
          placeholder="Add Course to Filter By"
          selection
          className="mini"
          fluid
          button
          value={[]}
          onChange={onChange}
          multiple
          closeOnChange
          style={{ marginTop: '3rem' }}
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
