import React, { createContext, useState, useCallback, useContext, useEffect } from 'react'
import { useGetAuthorizedUserQuery } from 'redux/auth'
import { LANGUAGE_CODES } from '../../constants'
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

export const getTextInWithLanguage = (texts, language) => {
  if (texts) {
    return texts[language] || texts.fi || texts.en || texts.sv || Object.values(texts)[0]
  }
  return null
}
export default () => {
  const [state, setState] = useContext(LanguageContext)

  const getTextIn = useCallback(text => getTextInWithLanguage(text, state), [state])

  const getTextInWrapped = (item, lang) => {
    if (!lang) {
      return getTextIn(item)
    }
    return getTextInWithLanguage(item, lang)
  }
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
