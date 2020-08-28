import React from 'react'
import { connect } from 'react-redux'
import { shape, arrayOf, string, bool } from 'prop-types'
import PopulationCourseStats from '../../PopulationCourseStats'

const CustomPopulationCourses = ({ courses, pending, selectedStudents, query }) => {
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
  query: shape({}).isRequired
}

const mapStateToProps = ({ populationCourses }) => ({
  courses: populationCourses.data,
  pending: populationCourses.pending,
  query: populationCourses.query
})

export default connect(mapStateToProps)(CustomPopulationCourses)
