/**
 * Context for those expandable filter panels that need to be opened/closed remotely.
 */
import React, { createContext, useState, useContext } from 'react'
import PropTypes from 'prop-types'

const FilterTrayContext = createContext([[], () => {}])
FilterTrayContext.displayName = 'Filter Tray'

export const FilterTrayProvider = ({ children }) => {
  // transferredToProgrammeFilter is open by default since it is also active by default
  const [state, setState] = useState({ transferredToProgrammeFilter: true })
  return <FilterTrayContext.Provider value={[state, setState]}>{children}</FilterTrayContext.Provider>
}

FilterTrayProvider.propTypes = {
  children: PropTypes.node.isRequired,
}

export default key => {
  const [state, setState] = useContext(FilterTrayContext)

  const value = state[key] || false
  const setValue = newValue => setState(prev => ({ ...prev, [key]: !!newValue }))
  const toggleValue = () => setState(prev => ({ ...prev, [key]: !prev[key] }))

  return [value, setValue, toggleValue]
}
