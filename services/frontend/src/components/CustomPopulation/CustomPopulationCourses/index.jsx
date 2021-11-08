import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import PopulationCourseStatsFlat from '../../PopulationCourseStats/PopulationCourseStatsFlat'
import useCourseFilter from '../../FilterTray/filters/Courses/useCourseFilter'

const CustomPopulationCourses = ({ courses, pending, selectedStudents, query, error, showFilter = false }) => {
  const { setCourses, resetCourses } = useCourseFilter()

  useEffect(() => {
    if (!pending && !error && courses.coursestatistics) {
      setCourses(courses.coursestatistics)
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

const mapStateToProps = ({ populationCourses }) => ({
  courses: populationCourses.data,
  pending: populationCourses.pending,
  query: populationCourses.query,
  error: populationCourses.error,
})

export default connect(mapStateToProps)(CustomPopulationCourses)
