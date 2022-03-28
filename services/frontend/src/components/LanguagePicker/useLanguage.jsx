import React, { createContext, useState, useCallback, useContext, useEffect } from 'react'
import { useGetAuthorizedUserQuery } from 'redux/auth'
import { LANGUAGE_CODES } from '../../constants'
import { getTextIn } from '../../common'
import { callApi } from '../../apiConnection'

const LanguageContext = createContext([[], () => {}])
LanguageContext.displayName = 'Language'

export const LanguageProvider = ({ children }) => {
  let language = 'fi'
  const [state, setState] = useState(language)
  const user = useGetAuthorizedUserQuery()
  if (user) {
    language = user.language
  }

  // Load selected language.
  useEffect(() => {
    if (LANGUAGE_CODES.includes(user?.language)) {
      setState(user.language)
    }
  }, [language])

  return <LanguageContext.Provider value={[state, setState]}>{children}</LanguageContext.Provider>
}

export default () => {
  const [state, setState] = useContext(LanguageContext)

  const getTextInWrapped = useCallback(text => getTextIn(text, state), [state])

  const setLanguage = newLanguage => {
    if (!LANGUAGE_CODES.includes(newLanguage)) {
      throw new Error('Illegal language code passed to useLanguage hook!')
    }

    setState(newLanguage)
    callApi('/language', 'post', { language: newLanguage })
  }

  return {
    language: state,
    setLanguage,
    getTextIn: getTextInWrapped,
  }
}
