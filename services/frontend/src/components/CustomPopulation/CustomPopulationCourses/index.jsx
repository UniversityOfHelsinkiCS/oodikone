import React from 'react'
import PopulationCourseStatsFlat from '../../PopulationCourseStats/PopulationCourseStatsFlat'

const CustomPopulationCourses = ({ courses, pending, filteredStudents, showFilter, studentAmountLimit }) => {
  return (
    <PopulationCourseStatsFlat
      courses={courses}
      pending={pending}
      filteredStudents={filteredStudents}
      showFilter={showFilter}
      studentAmountLimit={studentAmountLimit}
    />
  )
}

export default CustomPopulationCourses
