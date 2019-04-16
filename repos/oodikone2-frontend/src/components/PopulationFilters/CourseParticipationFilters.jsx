import React from 'react'
import { connect } from 'react-redux'
import { arrayOf, object } from 'prop-types'
import CourseParticipation from './CourseParticipation'

const CourseParticipationFilters = ({ filters }) => {
  if (filters.length === 0) {
    return null
  }

  return (
    <div>
      {filters.map(f => <CourseParticipation key={f.id} filter={f} />)}
    </div>
  )
}

CourseParticipationFilters.propTypes = {
  filters: arrayOf(object).isRequired
}

const mapStateToProps = state => ({
  filters: state.populationFilters.filters.filter(f => f.type === 'CourseParticipation')
})

export default connect(mapStateToProps)(CourseParticipationFilters)
