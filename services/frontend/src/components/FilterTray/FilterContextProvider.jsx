import React from 'react'
import { CourseFilterProvider } from './filters/Courses/useCourseFilter'
import { CreditFilterProvider } from './filters/CreditsEarned/useCreditFilter'
import { AgeFilterProvider } from './filters/Age/useAgeFilter'
import { FilterTrayProvider } from './useFilterTray'
import { ProgrammeFilterProvider } from './filters/Programmes/useProgrammeFilter'
import { FilterProvider } from './useFilters'
import { FilterAnalyticsProvider } from './useAnalytics'
import { GradeFilterProvider } from './filters/Grade/useGradeFilter'

const filterProviders = [
  FilterAnalyticsProvider,
  FilterTrayProvider,
  FilterProvider,
  CourseFilterProvider,
  CreditFilterProvider,
  AgeFilterProvider,
  GradeFilterProvider,
  ProgrammeFilterProvider,
]

const FilterContextProvider = ({ children }) =>
  filterProviders.reduceRight((children, Provider) => <Provider>{children}</Provider>, children)

export default FilterContextProvider
