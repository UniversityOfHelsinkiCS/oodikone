import React from 'react'
import PropTypes from 'prop-types'
import { CourseFilterProvider } from './filters/Courses/useCourseFilter'
import { CreditFilterProvider } from './filters/CreditsEarned/useCreditFilter'
import { FilterTrayProvider } from './useFilterTray'
import { FilterProvider } from './useFilters'

const FilterContextProvider = ({ children }) => (
  <FilterTrayProvider>
    <FilterProvider>
      <CourseFilterProvider>
        <CreditFilterProvider>{children}</CreditFilterProvider>
      </CourseFilterProvider>
    </FilterProvider>
  </FilterTrayProvider>
)

FilterContextProvider.propTypes = {
  children: PropTypes.node.isRequired
}

export default FilterContextProvider
