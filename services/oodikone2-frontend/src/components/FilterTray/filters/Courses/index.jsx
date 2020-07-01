import React from 'react'
import PropTypes from 'prop-types'
import { Card } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { getActiveLanguage } from 'react-localize-redux'
import FilterCard from '../common/FilterCard'
import CourseCard from './CourseCard'
import { getTextIn } from '../../../../common'
import useCourseFilter from './useCourseFilter'
import './courseFilter.css'
import DropdownWithUnfuckedPlaceholder from './DropdownWithUnfuckedPlaceholder'

const Courses = ({ filterControl, language }) => {
  const { courses: courseStats, selectedCourses, toggleCourseSelection } = useCourseFilter()

  // Wrestle course stats into something semantic-ui eats without throwing up.
  const options = courseStats
    .filter(course => course.stats.students > Math.round(filterControl.filteredStudents.length * 0.3))
    .filter(course => !selectedCourses.some(c => c.course.code === course.course.code))
    .map(course => ({
      key: `course-filter-option-${course.course.code}`,
      text: getTextIn(course.course.name, language),
      value: course.course.code
    }))

  return (
    <FilterCard title="Courses" active={!!selectedCourses.length} className="courses-filter">
      <DropdownWithUnfuckedPlaceholder
        options={options}
        placeholder="Select Course to Filter By"
        className="course-filter-selection"
        onChange={(_, { value }) => toggleCourseSelection(value[0])}
      />
      <Card.Group>
        {selectedCourses.map(course => (
          <CourseCard
            courseStats={course}
            filterContol={filterControl}
            key={`course-filter-selected-course-${course.course.code}`}
          />
        ))}
      </Card.Group>
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
