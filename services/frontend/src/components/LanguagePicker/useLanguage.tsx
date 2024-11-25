import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react'

import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { useModifyLanguageMutation } from '@/redux/users'
import { DEFAULT_LANG, LANGUAGE_CODES } from '@/shared/language'
import { Language } from '@/shared/types'

const LanguageContext = createContext<[Language, (language: Language) => void]>([DEFAULT_LANG, () => {}])
LanguageContext.displayName = 'Language'

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  let language: Language = DEFAULT_LANG
  const [state, setState] = useState<Language>(language)

  const user = useGetAuthorizedUserQuery()
  if (user) {
    language = user.language
  }

  useEffect(() => {
    if (LANGUAGE_CODES.includes(user?.language)) {
      setState(user.language)
    }
  }, [language])

  return <LanguageContext.Provider value={[state, setState]}>{children}</LanguageContext.Provider>
}

const getTextInWithLanguage = (texts: Record<string, string>, language: Language) => {
  if (texts) {
    return texts[language] || texts.fi || texts.en || texts.sv || Object.values(texts)[0]
  }
  return null
}

export const useLanguage = () => {
  const [state, setState] = useContext(LanguageContext)
  const [changeLanguage] = useModifyLanguageMutation()

  const getTextIn = useCallback((text: Record<string, string>) => getTextInWithLanguage(text, state), [state])

  const getTextInWrapped = (item: any, lang?: Language) => {
    if (!lang) {
      return getTextIn(item)
    }
    return getTextInWithLanguage(item, lang)
  }

  const setLanguage = (newLanguage: Language) => {
    if (!LANGUAGE_CODES.includes(newLanguage)) {
      throw new Error('Illegal language code passed to useLanguage hook!')
    }

    setState(newLanguage)
    void changeLanguage({ language: newLanguage })
  }

  return {
    language: state,
    setLanguage,
    getTextIn: getTextInWrapped,
  }
}
