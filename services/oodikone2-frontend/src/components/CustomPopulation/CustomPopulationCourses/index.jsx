import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import { shape, arrayOf, string, bool } from 'prop-types'
import PopulationCourseStats from '../../PopulationCourseStats'
import useCourseFilter from '../../FilterTray/filters/Courses/useCourseFilter'

const CustomPopulationCourses = ({ courses, pending, selectedStudents, query, error }) => {
  const { setCoursesOnce, resetCourses } = useCourseFilter()

  useEffect(() => {
    if (!pending && !error) {
      setCoursesOnce(courses.coursestatistics)
    }
  }, [courses])

  // Clear course filter data on unmount.
  useEffect(() => {
    return resetCourses
  }, [])

  return (
    <PopulationCourseStats
      courses={courses}
      query={query}
      pending={pending}
      selectedStudents={selectedStudents}
      customPopulation
    />
  )
}

CustomPopulationCourses.propTypes = {
  pending: bool.isRequired,
  courses: shape([]).isRequired,
  selectedStudents: arrayOf(string).isRequired,
  query: shape({}).isRequired,
  error: bool.isRequired
}

const mapStateToProps = ({ populationCourses }) => ({
  courses: populationCourses.data,
  pending: populationCourses.pending,
  query: populationCourses.query,
  error: populationCourses.error
})

export default connect(mapStateToProps)(CustomPopulationCourses)
