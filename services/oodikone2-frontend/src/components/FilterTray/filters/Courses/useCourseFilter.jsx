import React, { createContext, useState, useContext, useEffect } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { getPopulationSelectedStudentCourses } from '../../../../redux/populationSelectedStudentCourses'

const defaultState = {
  courses: [],
  selectedCourses: [],
  courseQueryData: {},
  courseQueryOptions: {},
  dispatchCourseQuery: null
}

const CourseFilterContext = createContext([[], () => {}])

const CourseFilterProvider = ({ children, getPopulationSelectedStudentCourses, populationSelectedStudentCourses }) => {
  const [state, setState] = useState(defaultState)

  // On load, extract the course query dispatch function from redux for further use.
  useEffect(() => {
    setState(prev => ({ ...prev, dispatchCourseQuery: getPopulationSelectedStudentCourses }))
  }, [])

  useEffect(() => {
    console.log(populationSelectedStudentCourses)
  }, [populationSelectedStudentCourses])

  return <CourseFilterContext.Provider value={[state, setState]}>{children}</CourseFilterContext.Provider>
}

CourseFilterProvider.propTypes = {
  children: PropTypes.node.isRequired,
  getPopulationSelectedStudentCourses: PropTypes.func.isRequired
}

const ConnectedProvider = connect(
  ({ populationSelectedStudentCourses }) => ({ populationSelectedStudentCourses }),
  { getPopulationSelectedStudentCourses }
)(CourseFilterProvider)

export { ConnectedProvider as CourseFilterProvider }

// Acual hook functions.
export default () => {
  const [state, setState] = useContext(CourseFilterContext)
  const { courses, selectedCourses, courseQueryOptions, dispatchCourseQuery } = state

  const setCourses = courses => setState(prev => ({ ...prev, courses }))

  const toggleCourseSelection = courseCode =>
    setState(prev => {
      const course = courses.find(course => course.course.code === courseCode)
      const isSelected = prev.selectedCourses.some(c => c.course.code === courseCode)

      return {
        ...prev,
        selectedCourses: isSelected
          ? prev.selectedCourses.filter(c => c.course.code !== courseCode)
          : prev.selectedCourses.concat(course)
      }
    })

  const courseIsSelected = courseCode => selectedCourses.some(course => course.course.code === courseCode)

  const setCourseQueryOpts = courseQueryOptions => setState(prev => ({ ...prev, courseQueryOptions }))

  const runCourseQuery = opts => {
    dispatchCourseQuery(opts)
  }

  return {
    courses,
    selectedCourses,
    setCourses,
    toggleCourseSelection,
    courseIsSelected,
    setCourseQueryOpts,
    runCourseQuery
  }
}
