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

  const sendEvent = (event, name, value = undefined) => state && TSA.Matomo.sendEvent(category, event, name, value)

  const setTarget = name => setState(name)
  const unsetTarget = () => setState(null)
  const setFilter = (name, value) => sendEvent('Set Filter', name, value)
  const clearFilter = name => sendEvent('Clear Filter', name)
  const openTray = () => sendEvent('Toggle Filter Tray', 'Open')
  const closeTray = () => sendEvent('Toggle Filter Tray', 'Close')

  return {
    setTarget,
    unsetTarget,
    setFilter,
    clearFilter,
    openTray,
    closeTray
  }
}
