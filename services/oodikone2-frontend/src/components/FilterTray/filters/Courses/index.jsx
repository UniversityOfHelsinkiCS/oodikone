import React from 'react'
import PropTypes from 'prop-types'
import { Card } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { getActiveLanguage, getTranslate } from 'react-localize-redux'
import FilterCard from '../common/FilterCard'
import CourseCard from './CourseCard'
import { getTextIn } from '../../../../common'
import useCourseFilter from './useCourseFilter'
import './courseFilter.css'
import DropdownWithUnfuckedPlaceholder from './DropdownWithUnfuckedPlaceholder'
import useFilters from '../../useFilters'
import useAnalytics from '../../useAnalytics'

export const contextKey = 'coursesFilter'

const Courses = ({ language, translate }) => {
  const { courses: courseStats, selectedCourses, toggleCourseSelection } = useCourseFilter()
  const { filteredStudents } = useFilters()
  const analytics = useAnalytics()
  const name = 'courseFilter'

  // Wrestle course stats into something semantic-ui eats without throwing up.
  const makeLabel = cs => `${cs.course.code} - ${getTextIn(cs.course.name, language)}`
  const options = courseStats
    .filter(cs => cs.stats.students > Math.round(filteredStudents.length * 0.3))
    .filter(cs => !selectedCourses.some(c => c.course.code === cs.course.code))
    .sort((a, b) => makeLabel(a).localeCompare(makeLabel(b)))
    .map(cs => ({
      key: `course-filter-option-${cs.course.code}`,
      text: makeLabel(cs),
      value: cs.course.code
    }))

  const onChange = (_, { value }) => {
    const courseCode = value[0]
    toggleCourseSelection(courseCode)
    analytics.setFilter(name, courseCode)
  }

  return (
    <FilterCard
      title="Courses"
      active={!!selectedCourses.length}
      className="courses-filter"
      contextKey={contextKey}
      name={name}
    >
      <DropdownWithUnfuckedPlaceholder
        options={options}
        placeholder={translate('courseFilter.courseSelectorLabel')}
        className="course-filter-selection"
        onChange={onChange}
        name={name}
      />
      <Card.Group>
        {selectedCourses.map(course => (
          <CourseCard courseStats={course} key={`course-filter-selected-course-${course.course.code}`} />
        ))}
      </Card.Group>
    </FilterCard>
  )
}

Courses.propTypes = {
  language: PropTypes.string.isRequired,
  translate: PropTypes.func.isRequired
}

const mapStateToProps = ({ localize }) => ({
  language: getActiveLanguage(localize).code,
  translate: getTranslate(localize)
})

export default connect(mapStateToProps)(Courses)
