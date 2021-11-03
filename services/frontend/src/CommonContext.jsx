import React from 'react'
import FilterContextProvider from './components/FilterTray/FilterContextProvider'
import { LanguageProvider } from './components/LanguagePicker/useLanguage'

const CommonContext = ({ children }) => (
  <LanguageProvider>
    <FilterContextProvider>{children}</FilterContextProvider>
  </LanguageProvider>
)

export default CommonContext
