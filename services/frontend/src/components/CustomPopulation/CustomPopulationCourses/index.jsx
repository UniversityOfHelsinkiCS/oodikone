import React from 'react'
import { useSelector } from 'react-redux'
import PopulationCourseStatsFlat from '../../PopulationCourseStats/PopulationCourseStatsFlat'

const CustomPopulationCourses = ({ courses, pending, selectedStudents, query, showFilter }) => {
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
