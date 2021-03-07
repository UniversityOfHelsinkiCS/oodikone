import React from 'react'
import PropTypes from 'prop-types'
import { CourseFilterProvider } from './filters/Courses/useCourseFilter'
import { CreditFilterProvider } from './filters/CreditsEarned/useCreditFilter'
import { AgeFilterProvider } from './filters/Age/useAgeFilter'
import { FilterTrayProvider } from './useFilterTray'
import { FilterProvider } from './useFilters'
import { FilterAnalyticsProvider } from './useAnalytics'
import { GradeFilterProvider } from './filters/Grade/useGradeFilter'

const FilterContextProvider = ({ children }) => (
  <FilterAnalyticsProvider>
    <FilterTrayProvider>
      <FilterProvider>
        <CourseFilterProvider>
          <CreditFilterProvider>
            <AgeFilterProvider>
              <GradeFilterProvider>{children}</GradeFilterProvider>
            </AgeFilterProvider>
          </CreditFilterProvider>
        </CourseFilterProvider>
      </FilterProvider>
    </FilterTrayProvider>
  </FilterAnalyticsProvider>
)

FilterContextProvider.propTypes = {
  children: PropTypes.node.isRequired
}

export default FilterContextProvider
