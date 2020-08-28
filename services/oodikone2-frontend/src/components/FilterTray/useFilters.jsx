/**
 * Context for managing filtering.
 */
import React, { createContext, useState, useContext, useEffect } from 'react'
import PropTypes from 'prop-types'
import lodash from 'lodash'

const defaultState = {
  allStudents: [],
  filteredStudents: [],
  activeFilters: {}
}

const applyFilters = (filters, allStudents) =>
  Object.values(filters).reduce((students, nextFilter) => students.filter(nextFilter), allStudents)

const FilterContext = createContext([[], () => {}])
FilterContext.displayName = 'Filters'

export const FilterProvider = ({ children }) => {
  const [state, setState] = useState(defaultState)
  const { activeFilters, allStudents } = state

  // Apply filters as a side-effect.
  useEffect(() => {
    setState(prev => ({ ...prev, filteredStudents: applyFilters(activeFilters, allStudents) }))
  }, [activeFilters, allStudents])

  return <FilterContext.Provider value={[state, setState]}>{children}</FilterContext.Provider>
}

FilterProvider.propTypes = {
  children: PropTypes.node.isRequired
}

export default () => {
  const [state, setState] = useContext(FilterContext)

  const setAllStudents = allStudents => setState(prev => ({ ...prev, allStudents }))

  const addFilter = (name, filterFn) =>
    setState(prev => ({ ...prev, activeFilters: { ...prev.activeFilters, [name]: filterFn } }))

  const removeFilter = name => setState(prev => ({ ...prev, activeFilters: lodash.omit(prev.activeFilters, name) }))

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
    addFilter,
    removeFilter,
    withoutFilter
  }
}
