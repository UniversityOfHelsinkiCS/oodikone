import React, { createContext, useState, useContext } from 'react'
import PropTypes from 'prop-types'

const defaultState = {
  courses: [],
  selectedCourses: []
}

const CourseFilterContext = createContext([[], () => {}])

export const CourseFilterProvider = ({ children }) => {
  const [state, setState] = useState(defaultState)
  return <CourseFilterContext.Provider value={[state, setState]}>{children}</CourseFilterContext.Provider>
}

CourseFilterProvider.propTypes = {
  children: PropTypes.node.isRequired
}

export default () => {
  const [state, setState] = useContext(CourseFilterContext)
  const { courses, selectedCourses } = state

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

  return { courses, selectedCourses, setCourses, toggleCourseSelection, courseIsSelected }
}
