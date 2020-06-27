import React, { createContext, useState, useContext } from 'react'
import PropTypes from 'prop-types'

const CourseFilterContext = createContext([[], () => {}])

export const CourseFilterProvider = ({ children }) => {
  const [state, setState] = useState([])
  return <CourseFilterContext.Provider value={[state, setState]}>{children}</CourseFilterContext.Provider>
}

CourseFilterProvider.propTypes = {
  children: PropTypes.node.isRequired
}

export const defaulState = {
  courses: [],
  selectedCourses: []
}

export default () => {
  const [state, setState] = useContext(CourseFilterContext)

  const setCourses = courses => setState(courses)

  return { courses: state, setCourses }
}
