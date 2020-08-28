import React, { createContext, useState, useContext, useEffect } from 'react'
import PropTypes from 'prop-types'
import localforage from 'localforage'

const storageName = 'oodikoneFeatureToggle'

const FeatureToggleContext = createContext([[], () => {}])
FeatureToggleContext.displayName = 'Feature Toggle'

export const FeatureToggleProvider = ({ children }) => {
  const [state, setState] = useState({})

  useEffect(() => {
    ;(async () => {
      setState((await localforage.getItem(storageName)) || {})
    })()
  }, [])

  return <FeatureToggleContext.Provider value={[state, setState]}>{children}</FeatureToggleContext.Provider>
}

FeatureToggleProvider.propTypes = {
  children: PropTypes.node.isRequired
}

/**
 * Custom hook for implementing boolean feature toggles.
 * Toggle value is saved in client and restored on reload. Use this hook for temporary
 * feature toggles.
 * @param {string} name Name of the toggle you want to use.
 */
export default name => {
  const [state, setState] = useContext(FeatureToggleContext)

  const featureToggle = state[name] || false

  /**
   * Set toggle value.
   * @param {bool} value New value
   */
  const setFeatureToggle = value => {
    setState(prev => {
      const next = { ...prev, [name]: !!value }
      localforage.setItem(storageName, next)
      return next
    })
  }

  /**
   * Switch toggle value between `true` and `false`.
   */
  const toggleFeatureToggle = () => {
    setState(prev => {
      const next = { ...prev, [name]: !prev[name] }
      localforage.setItem(storageName, next)
      return next
    })
  }

  return [featureToggle, setFeatureToggle, toggleFeatureToggle]
}
