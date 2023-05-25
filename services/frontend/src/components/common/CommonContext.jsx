import React from 'react'
import { LanguageProvider } from '../LanguagePicker/useLanguage'

const CommonContext = ({ children }) => <LanguageProvider>{children}</LanguageProvider>

export default CommonContext
