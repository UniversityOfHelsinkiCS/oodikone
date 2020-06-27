import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { Form, Dropdown, Card } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { getActiveLanguage } from 'react-localize-redux'
import FilterCard from '../common/FilterCard'
import CourseCard from './CourseCard'
import { getTextIn } from '../../../../common'
import useCourseFilter from './useCourseFilter'

const Courses = ({ filterControl, language }) => {
  const { courses: courseStats } = useCourseFilter()
  const [selectedCourses, setSelectedCourses] = useState([])

  const onChange = (_, { value }) =>
    setSelectedCourses(prev => prev.concat(courseStats.find(course => course.course.code === value[0])))

  const removeCourse = course => () => setSelectedCourses(prev => prev.filter(c => c !== course))

  // Wrestle course stats into something semantic-ui eats without throwing up.
  const options = courseStats
    .filter(course => course.stats.students > Math.round(filterControl.filteredStudents.length * 0.3))
    .filter(course => !selectedCourses.includes(course))
    .map(course => ({
      key: `course-filter-option-${course.course.code}`,
      text: getTextIn(course.course.name, language),
      value: course.course.code
    }))

  return (
    <FilterCard title="Courses">
      <Form>
        <Card.Group>
          {selectedCourses.map(course => (
            <CourseCard
              courseStats={course}
              filterContol={filterControl}
              key={`course-filter-selected-course-${course.course.code}`}
              removeCourse={removeCourse(course)}
            />
          ))}
        </Card.Group>
        <Dropdown
          options={options}
          placeholder="Select Course to Filter By"
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
  }).isRequired,
  language: PropTypes.string.isRequired
}

const mapStateToProps = ({ localize }) => ({
  language: getActiveLanguage(localize).code
})

export default connect(mapStateToProps)(Courses)
