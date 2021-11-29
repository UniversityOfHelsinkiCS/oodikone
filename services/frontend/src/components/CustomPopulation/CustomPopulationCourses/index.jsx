import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import PopulationCourseStatsFlat from '../../PopulationCourseStats/PopulationCourseStatsFlat'

const CustomPopulationCourses = ({ selectedStudents, showFilter = false }) => {
  // const { setCourses, resetCourses } = useCourseFilter()
  const { data: courses, pending, error } = useSelector(({ populationCourses }) => populationCourses)

  useEffect(() => {
    if (!pending && !error && courses.coursestatistics) {
      // FIXME setCourses(courses.coursestatistics)
    }
  }, [courses])

  // Clear course filter data on unmount.
  useEffect(() => {
    return () => {} // FIXME: resetCourses
  }, [])

  return (
    <PopulationCourseStatsFlat
      courses={courses}
      pending={pending}
      selectedStudents={selectedStudents}
      showFilter={showFilter}
    />
  )
}
export default CustomPopulationCourses
