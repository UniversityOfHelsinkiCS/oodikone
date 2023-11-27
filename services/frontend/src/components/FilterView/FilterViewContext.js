import { createContext } from 'react'

const defaultState = {
  viewName: '<Unset>',
  allStudents: [],
  filteredStudents: [],
  getContextByKey: () => ({
    students: [],
    precomputed: null,
    options: null,
    args: null,
  }),
  filterOptions: {},
  filters: [],
  precomputed: {},
  withoutFilter: () => [],
  setFilterOptions: () => {},
  resetFilter: () => {},
  resetFilters: () => {},
}

export const FilterViewContext = createContext(defaultState)
FilterViewContext.displayName = 'FilterView'
