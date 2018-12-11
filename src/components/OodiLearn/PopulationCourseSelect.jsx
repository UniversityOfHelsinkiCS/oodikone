import React from 'react'
import { Dropdown } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { shape, func, arrayOf, string } from 'prop-types'
import { setCourse } from '../../redux/oodilearnPopulationCourseSelect'
import selector from '../../selectors/oodilearnPopulations'

const PopulationFilters = ({ courses, selectedCourse, setSelectedCourse }) => (
  <Dropdown
    fluid
    placeholder="All courses"
    options={courses}
    value={selectedCourse}
    onChange={(e, { value }) => setSelectedCourse(value)}
    clearable
    selection
    search
  />
)

PopulationFilters.propTypes = {
  setSelectedCourse: func.isRequired,
  courses: arrayOf(shape({})).isRequired,
  selectedCourse: string
}

PopulationFilters.defaultProps = {
  selectedCourse: undefined
}

const mapStateToProps = state => ({
  form: state.oodilearnPopulationForm,
  courses: selector.getPopulationCourses(state),
  selectedCourse: selector.selectedCourseSelector(state)
})

export default connect(mapStateToProps, {
  setSelectedCourse: setCourse
})(PopulationFilters)
