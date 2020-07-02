import React from 'react'
import PropTypes from 'prop-types'
import { FeatureToggleProvider } from './common/useFeatureToggle'
import FilterContextProvider from './components/FilterTray/FilterContextProvider'

const CommonContext = ({ children }) => (
  <FeatureToggleProvider>
    <FilterContextProvider>{children}</FilterContextProvider>
  </FeatureToggleProvider>
)

CommonContext.propTypes = {
  children: PropTypes.node.isRequired
}

export default CommonContext
