import React from 'react'
import PropTypes from 'prop-types'
import FilterContextProvider from './components/FilterTray/FilterContextProvider'
import { LanguageProvider } from './components/LanguagePicker/useLanguage'

const CommonContext = ({ children }) => (
  <LanguageProvider>
    <FilterContextProvider>{children}</FilterContextProvider>
  </LanguageProvider>
)

CommonContext.propTypes = {
  children: PropTypes.node.isRequired,
}

export default CommonContext
