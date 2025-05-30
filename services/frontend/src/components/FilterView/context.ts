import { createContext } from 'react'

import type { Student } from '.'
import type { Filter } from './filters/createFilter'

export type FilterContext = {
  students: Student[]
  precomputed: any // can be null
  options: Record<string, any>
  args: any // can be null
}

export type FilterViewContextState = {
  viewName: string
  allStudents: Student[]
  filters: Filter[]
  precomputed: Record<string, any>
  filterOptions: Record<string, any>
  filteredStudents: Student[]
  getContextByKey: (key: string) => FilterContext
  withoutFilter: (key: string) => any[]
  setFilterOptions: (filter: string, options: any) => void
  resetFilter: (filter: string) => void
  resetFilters: () => void
  areOptionsDirty: (key: string) => boolean
}

const defaultState = {
  viewName: '<Unset>',
  allStudents: [],
  filters: [],
  precomputed: {},
  filterOptions: {},
  filteredStudents: [],
  getContextByKey: () => ({
    students: [],
    precomputed: null,
    options: {},
    args: null,
  }),
  withoutFilter: () => [],
  setFilterOptions: () => {},
  resetFilter: () => {},
  resetFilters: () => {},
  areOptionsDirty: () => false,
}

export const FilterViewContext = createContext<FilterViewContextState>(defaultState)
FilterViewContext.displayName = 'FilterView'
