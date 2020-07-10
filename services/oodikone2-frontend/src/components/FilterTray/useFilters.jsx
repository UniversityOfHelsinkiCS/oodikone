/**
 * Context for managing filtering.
 */
import React, { createContext, useState, useContext } from 'react'
import PropTypes from 'prop-types'

const defaultState = {
  allStudents: [],
  filteredStudents: []
}

const FilterContext = createContext([[], () => {}])

export const FilterProvider = ({ children }) => {
  const [state, setState] = useState(defaultState)
  return <FilterContext.Provider value={[state, setState]}>{children}</FilterContext.Provider>
}

FilterProvider.propTypes = {
  children: PropTypes.node.isRequired
}

export default () => {
  const [state, setState] = useContext(FilterContext)

  const setAllStudents = allStudents => setState(prev => ({ ...prev, allStudents }))

  const setFilteredStudents = filteredStudents => setState(prev => ({ ...prev, filteredStudents }))

  const { allStudents, filteredStudents } = state

  return {
    allStudents,
    setAllStudents,
    filteredStudents,
    setFilteredStudents
  }
}
