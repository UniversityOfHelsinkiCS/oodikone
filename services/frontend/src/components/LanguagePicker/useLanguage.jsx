import { createContext, useState, useCallback, useContext, useEffect } from 'react'

import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { useModifyLanguageMutation } from '@/redux/users'
import { DEFAULT_LANG, LANGUAGE_CODES } from '@/shared/language'

const LanguageContext = createContext([[], () => {}])
LanguageContext.displayName = 'Language'

export const LanguageProvider = ({ children }) => {
  let language = DEFAULT_LANG
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

const getTextInWithLanguage = (texts, language) => {
  if (texts) {
    return texts[language] || texts.fi || texts.en || texts.sv || Object.values(texts)[0]
  }
  return null
}
export const useLanguage = () => {
  const [state, setState] = useContext(LanguageContext)
  const [changeLanguage] = useModifyLanguageMutation()

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
    changeLanguage({ language: newLanguage })
  }

  return {
    language: state,
    setLanguage,
    getTextIn: getTextInWrapped,
  }
}
