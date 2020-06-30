import React from 'react'
import PropTypes from 'prop-types'
import { CourseFilterProvider } from './filters/Courses/useCourseFilter'
import { CreditFilterProvider } from './filters/TotalCredits/useCreditFilter'

const FilterContextProvider = ({ children }) => (
  <CourseFilterProvider>
    <CreditFilterProvider>{children}</CreditFilterProvider>
  </CourseFilterProvider>
)

FilterContextProvider.propTypes = {
  children: PropTypes.node.isRequired
}

export default FilterContextProvider
