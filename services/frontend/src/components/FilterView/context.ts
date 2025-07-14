import { createContext } from 'react'

import type { Student } from '.'
import type { Filter } from './filters/createFilter'

export type FilterContext = {
  students: Student[]
  precomputed: any // can be null
  options: Record<string, any>
  args: any // can be null
}

export const getDefaultFilterContext = () => ({ ...defaultFilterContext })
const defaultFilterContext: FilterContext = {
  students: [],
  precomputed: null,
  options: {},
  args: undefined,
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
  getContextByKey: () => getDefaultFilterContext(),
  setFilterOptions: () => {},
  resetFilter: () => {},
  resetFilters: () => {},
  areOptionsDirty: () => false,
}

export const FilterViewContext = createContext<FilterViewContextState>(defaultState)
FilterViewContext.displayName = 'FilterView'
