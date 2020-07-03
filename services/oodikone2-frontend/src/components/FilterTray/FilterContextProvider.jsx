import React from 'react'
import PropTypes from 'prop-types'
import { CourseFilterProvider } from './filters/Courses/useCourseFilter'
import { CreditFilterProvider } from './filters/CreditsEarned/useCreditFilter'
import { FilterTrayProvider } from './useFilterTray'

const FilterContextProvider = ({ children }) => (
  <FilterTrayProvider>
    <CourseFilterProvider>
      <CreditFilterProvider>{children}</CreditFilterProvider>
    </CourseFilterProvider>
  </FilterTrayProvider>
)

FilterContextProvider.propTypes = {
  children: PropTypes.node.isRequired
}

export default FilterContextProvider
