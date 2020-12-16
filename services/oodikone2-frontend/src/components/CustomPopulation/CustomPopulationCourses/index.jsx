import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import { shape, arrayOf, string, bool } from 'prop-types'
import PopulationCourseStatsFlat from '../../PopulationCourseStats/PopulationCourseStatsFlat'
import useCourseFilter from '../../FilterTray/filters/Courses/useCourseFilter'

const CustomPopulationCourses = ({ courses, pending, selectedStudents, query, error, showFilter }) => {
  const { setCoursesOnce, resetCourses } = useCourseFilter()

  useEffect(() => {
    if (!pending && !error && courses.coursestatistics) {
      setCoursesOnce(courses.coursestatistics)
    }
  }, [courses])

  // Clear course filter data on unmount.
  useEffect(() => {
    return resetCourses
  }, [])

  return (
    <PopulationCourseStatsFlat
      courses={courses}
      query={query}
      pending={pending}
      selectedStudents={selectedStudents}
      customPopulation
      showFilter={showFilter}
    />
  )
}

CustomPopulationCourses.propTypes = {
  pending: bool.isRequired,
  courses: shape([]).isRequired,
  selectedStudents: arrayOf(string).isRequired,
  query: shape({}).isRequired,
  error: bool.isRequired,
  showFilter: bool
}

const mapStateToProps = ({ populationCourses }) => ({
  courses: populationCourses.data,
  pending: populationCourses.pending,
  query: populationCourses.query,
  error: populationCourses.error
})

export default connect(mapStateToProps)(CustomPopulationCourses)
