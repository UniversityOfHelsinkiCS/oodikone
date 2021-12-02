import React from 'react'
import PopulationCourseStatsFlat from '../../PopulationCourseStats/PopulationCourseStatsFlat'

const CustomPopulationCourses = ({ courses, pending, filteredStudents, showFilter }) => {
  return (
    <PopulationCourseStatsFlat
      courses={courses}
      pending={pending}
      filteredStudents={filteredStudents}
      showFilter={showFilter}
    />
  )
}

export default CustomPopulationCourses
