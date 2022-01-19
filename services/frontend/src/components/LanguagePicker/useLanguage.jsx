import React, { createContext, useState, useContext, useEffect } from 'react'
import { useGetAuthorizedUserQuery } from 'redux/auth'
import { LANGUAGE_CODES } from '../../constants'
import { callApi } from '../../apiConnection'

const LanguageContext = createContext([[], () => {}])
LanguageContext.displayName = 'Language'

export const LanguageProvider = ({ children }) => {
  const [state, setState] = useState(LANGUAGE_CODES[0])
  const user = useGetAuthorizedUserQuery()

  // Load selected language.
  useEffect(() => {
    if (LANGUAGE_CODES.includes(user?.language)) {
      setState(user.language)
    }
  }, [])

  return <LanguageContext.Provider value={[state, setState]}>{children}</LanguageContext.Provider>
}

export default () => {
  const [state, setState] = useContext(LanguageContext)
  const setLanguage = newLanguage => {
    if (!LANGUAGE_CODES.includes(newLanguage)) {
      throw new Error('Illegal language code passed to useLanguage hook!')
    }

    setState(newLanguage)
    callApi('/language', 'post', { language: newLanguage })
  }

  return { language: state, setLanguage }
}
