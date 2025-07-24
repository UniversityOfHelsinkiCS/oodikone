import { createContext } from 'react'

import type { FormattedStudent as Student } from '@oodikone/shared/types/studentData'
import type { Filter } from './filters/createFilter'

export type FilterContext = {
  precomputed: any // can be null
  options: Record<string, any>
  args: any // can be null
}

export type FilterViewContextState = {
  viewName: string
  allStudents: Student[]
  filters: Filter[]
  filteredStudents: Student[]
  getContextByKey: (key: string) => FilterContext
  /** Set filter options */
  setFilterOptions: (filter: string, options: any) => void
  resetFilter: (filter: string) => void
  resetFilters: () => void
  areOptionsDirty: (key: string) => boolean
}

const defaultState: FilterViewContextState = {
  viewName: '<Unset>',
  allStudents: [],
  filters: [],
  filteredStudents: [],
  getContextByKey: () => ({
    precomputed: null,
    options: {},
    args: undefined,
  }),
  setFilterOptions: () => {},
  resetFilter: () => {},
  resetFilters: () => {},
  areOptionsDirty: () => false,
}

export const FilterViewContext = createContext<FilterViewContextState>(defaultState)
FilterViewContext.displayName = 'FilterView'
