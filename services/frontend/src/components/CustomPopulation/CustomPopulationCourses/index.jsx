import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import PopulationCourseStatsFlat from '../../PopulationCourseStats/PopulationCourseStatsFlat'
import useCourseFilter from '../../FilterTray/filters/Courses/useCourseFilter'

const CustomPopulationCourses = ({ selectedStudents, showFilter = false }) => {
  const { setCourses, resetCourses } = useCourseFilter()
  const { data: courses, pending, query, error } = useSelector(({ populationCourses }) => populationCourses)

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
export default CustomPopulationCourses
