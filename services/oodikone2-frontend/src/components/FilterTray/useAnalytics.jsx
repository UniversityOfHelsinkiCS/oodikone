import React, { createContext, useState, useContext } from 'react'
import PropTypes from 'prop-types'
import TSA from '../../common/tsa'

const FilterAnalyticsContext = createContext([[], () => {}])

export const FilterAnalyticsProvider = ({ children }) => {
  const [state, setState] = useState(null)
  return <FilterAnalyticsContext.Provider value={[state, setState]}>{children}</FilterAnalyticsContext.Provider>
}

FilterAnalyticsProvider.propTypes = {
  children: PropTypes.node.isRequired
}

export default () => {
  const [state, setState] = useContext(FilterAnalyticsContext)

  const setTarget = name => setState(name)
  const unsetTarget = () => setState(null)

  const setFilter = (name, value) => state && TSA.Matomo.sendEvent(`Filters (${state})`, 'Set Filter', name, value)

  const clearFilter = name => state && TSA.Matomo.sendEvent(`Filters (${state})`, 'Clear Filter', name)

  return {
    setTarget,
    unsetTarget,
    setFilter,
    clearFilter
  }
}
