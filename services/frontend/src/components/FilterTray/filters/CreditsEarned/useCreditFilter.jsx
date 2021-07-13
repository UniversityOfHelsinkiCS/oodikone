import React, { createContext, useState, useContext } from 'react'
import PropTypes from 'prop-types'

const defaultState = {
  currentValue: { min: '', max: '' },
  requestedValue: { min: null, max: null }
}

const CreditFilterContext = createContext([[], () => {}])
CreditFilterContext.displayName = 'Credit Filter'

export const CreditFilterProvider = ({ children }) => {
  const [state, setState] = useState(defaultState)
  return <CreditFilterContext.Provider value={[state, setState]}>{children}</CreditFilterContext.Provider>
}

CreditFilterProvider.propTypes = {
  children: PropTypes.node.isRequired
}

export default () => {
  const [state, setState] = useContext(CreditFilterContext)
  const { currentValue, requestedValue } = state

  const setCurrentValue = newValue =>
    setState(prev => ({
      ...prev,
      currentValue: {
        ...prev.currentValue,
        ...newValue
      }
    }))

  const setRequestedValue = newValue =>
    setState(prev => ({
      ...prev,
      requestedValue: {
        ...prev.currentValue,
        ...newValue
      }
    }))

  return { currentValue, requestedValue, setCurrentValue, setRequestedValue }
}
