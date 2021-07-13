import React, { createContext, useState, useContext } from 'react'
import PropTypes from 'prop-types'

const defaultState = {
  currentValue: { min: '', max: '' },
  requestedValue: { min: null, max: null }
}

const AgeFilterContext = createContext([[], () => {}])
AgeFilterContext.displayName = 'Age Filter'

export const AgeFilterProvider = ({ children }) => {
  const [state, setState] = useState(defaultState)
  return <AgeFilterContext.Provider value={[state, setState]}>{children}</AgeFilterContext.Provider>
}

AgeFilterProvider.propTypes = {
  children: PropTypes.node.isRequired
}

const useAgeFilter = () => {
  const [state, setState] = useContext(AgeFilterContext)
  const { currentValue } = state

  const setCurrentValue = newValue =>
    setState(prev => ({
      ...prev,
      currentValue: {
        ...prev.currentValue,
        ...newValue
      }
    }))

  return { currentValue, setCurrentValue }
}

export default useAgeFilter
