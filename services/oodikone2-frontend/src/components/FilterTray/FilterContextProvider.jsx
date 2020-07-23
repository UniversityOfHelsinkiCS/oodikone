import React from 'react'
import PropTypes from 'prop-types'
import { CourseFilterProvider } from './filters/Courses/useCourseFilter'
import { CreditFilterProvider } from './filters/CreditsEarned/useCreditFilter'
import { FilterTrayProvider } from './useFilterTray'
import { FilterProvider } from './useFilters'
import { FilterAnalyticsProvider } from './useAnalytics'

const FilterContextProvider = ({ children }) => (
  <FilterAnalyticsProvider>
    <FilterTrayProvider>
      <FilterProvider>
        <CourseFilterProvider>
          <CreditFilterProvider>{children}</CreditFilterProvider>
        </CourseFilterProvider>
      </FilterProvider>
    </FilterTrayProvider>
  </FilterAnalyticsProvider>
)

FilterContextProvider.propTypes = {
  children: PropTypes.node.isRequired
}

export default FilterContextProvider
