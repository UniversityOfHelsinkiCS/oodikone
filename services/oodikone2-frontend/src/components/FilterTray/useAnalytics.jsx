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
  const category = `Filters (${state})`

  const setTarget = name => setState(name)
  const unsetTarget = () => setState(null)
  const setFilter = (name, value) => state && TSA.Matomo.sendEvent(category, 'Set Filter', name, value)
  const clearFilter = name => state && TSA.Matomo.sendEvent(category, 'Clear Filter', name)
  const openTray = () => state && TSA.Matomo.sendEvent(category, 'Toggle Filter Tray', 'Open')
  const closeTray = () => state && TSA.Matomo.sendEvent(category, 'Toggle Filter Tray', 'Close')

  return {
    setTarget,
    unsetTarget,
    setFilter,
    clearFilter,
    openTray,
    closeTray
  }
}
