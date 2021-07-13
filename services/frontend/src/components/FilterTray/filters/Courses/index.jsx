import React from 'react'
import { Dropdown } from 'semantic-ui-react'
import FilterCard from '../common/FilterCard'
import CourseCard from './CourseCard'
import { getTextIn } from '../../../../common'
import useCourseFilter from './useCourseFilter'
import './courseFilter.css'
import useFilters from '../../useFilters'
import useAnalytics from '../../useAnalytics'
import useLanguage from '../../../LanguagePicker/useLanguage'

export const contextKey = 'coursesFilter'

const Courses = () => {
  const { language } = useLanguage()
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
      value: cs.course.code,
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
      <Dropdown
        options={options}
        placeholder="Select Course"
        selection
        className="mini course-filter-selection"
        fluid
        button
        value={[]}
        onChange={onChange}
        multiple
        closeOnChange
        search
        name={name}
        data-cy={`${name}-course-dropdown`}
      />
      {selectedCourses.map(course => (
        <CourseCard courseStats={course} key={`course-filter-selected-course-${course.course.code}`} />
      ))}
    </FilterCard>
  )
}

export default Courses
