import React from 'react'
import { LanguageProvider } from '../LanguagePicker/useLanguage'

export const CommonContext = ({ children }) => <LanguageProvider>{children}</LanguageProvider>
