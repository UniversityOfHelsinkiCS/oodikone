import React, { createContext, useState, useContext } from 'react'
import TSA from '../../common/tsa'

const FilterAnalyticsContext = createContext([[], () => {}])
FilterAnalyticsContext.displayName = 'Filter Analytics'

export const FilterAnalyticsProvider = ({ children }) => {
  const [state, setState] = useState(null)
  return <FilterAnalyticsContext.Provider value={[state, setState]}>{children}</FilterAnalyticsContext.Provider>
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
  const setFilterViaTable = (name, value) => sendEvent('Set Filter Via Table', name, value)
  const clearFilterViaTable = (name, value) => sendEvent('Clear Filter Via Table', name, value)

  return {
    setTarget,
    unsetTarget,
    setFilter,
    clearFilter,
    openTray,
    closeTray,
    setFilterViaTable,
    clearFilterViaTable,
  }
}
