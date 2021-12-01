import React from 'react'
import { LanguageProvider } from './components/LanguagePicker/useLanguage'

const CommonContext = ({ children }) => <LanguageProvider>{children}</LanguageProvider>

export default CommonContext
