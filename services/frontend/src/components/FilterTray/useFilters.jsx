/**
 * Context for managing filtering.
 */
import React, { createContext, useState, useContext, useEffect } from 'react'
import lodash from 'lodash'

const defaultState = {
  allStudents: [],
  filteredStudents: [],
  activeFilters: {},
  // This is a special filter that operates on students' courses instead of the student's themselves.
  creditDateFilter: null,
}

const applyFilters = (filters, allStudents) =>
  Object.values(filters).reduce((students, nextFilter) => students.filter(nextFilter), allStudents)

const FilterContext = createContext([[], () => {}])
FilterContext.displayName = 'Filters'

export const FilterProvider = ({ children }) => {
  const [state, setState] = useState(defaultState)
  const { activeFilters, allStudents, creditDateFilter } = state

  // Apply filters as a side-effect.
  useEffect(() => {
    const withRegularFilters = applyFilters(activeFilters, allStudents)
    const filteredStudents = withRegularFilters.map(({ courses, ...rest }) => ({
      ...rest,
      courses: creditDateFilter ? courses.filter(creditDateFilter.func) : courses,
    }))

    setState(prev => ({ ...prev, filteredStudents }))
  }, [activeFilters, allStudents, creditDateFilter])

  return <FilterContext.Provider value={[state, setState]}>{children}</FilterContext.Provider>
}

export default () => {
  const [state, setState] = useContext(FilterContext)

  const setAllStudents = allStudents => setState(prev => ({ ...prev, allStudents }))
  const setCreditDateFilter = creditDateFilter => setState(prev => ({ ...prev, creditDateFilter }))

  const addFilter = (name, filterFn) =>
    setState(prev => ({ ...prev, activeFilters: { ...prev.activeFilters, [name]: filterFn } }))

  const removeFilter = name => setState(prev => ({ ...prev, activeFilters: lodash.omit(prev.activeFilters, name) }))

  const creditDateFilterParams = state.creditDateFilter && lodash.omit(state.creditDateFilter, 'func')

  /**
   * Apply all active filters except for the one named as the argument.
   * This provides a way for a filter to count objects without itself affecting the sample.
   * @param {string} name Name of the filter to skip.
   */
  const withoutFilter = name => applyFilters(lodash.omit(state.activeFilters, name), state.allStudents)

  const { allStudents, filteredStudents, activeFilters } = state

  return {
    allStudents,
    filteredStudents,
    activeFilters,
    setAllStudents,
    setCreditDateFilter,
    addFilter,
    removeFilter,
    withoutFilter,
    creditDateFilterParams,
  }
}
