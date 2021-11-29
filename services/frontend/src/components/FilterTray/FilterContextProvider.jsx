import React from 'react'
import { FilterTrayProvider } from './useFilterTray'
import { FilterAnalyticsProvider } from './useAnalytics'

const filterProviders = [FilterAnalyticsProvider, FilterTrayProvider]

const FilterContextProvider = ({ children }) =>
  filterProviders.reduceRight((children, Provider) => <Provider>{children}</Provider>, children)

export default FilterContextProvider
