import React from 'react'
import PropTypes from 'prop-types'
import { FeatureToggleProvider } from './common/useFeatureToggle'
import FilterContextProvider from './components/FilterTray/FilterContextProvider'
import { LanguageProvider } from './components/LanguagePicker/useLanguage'

const CommonContext = ({ children }) => (
  <FeatureToggleProvider>
    <LanguageProvider>
      <FilterContextProvider>{children}</FilterContextProvider>
    </LanguageProvider>
  </FeatureToggleProvider>
)

CommonContext.propTypes = {
  children: PropTypes.node.isRequired
}

export default CommonContext
