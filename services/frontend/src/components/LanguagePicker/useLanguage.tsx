import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react'

import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { useModifyLanguageMutation } from '@/redux/users'
import { DEFAULT_LANG, isLanguage, Language } from '@oodikone/shared/language'
import { Name } from '@oodikone/shared/types'

type LanguageContextType = [Language, React.Dispatch<React.SetStateAction<Language>>]

// eslint-disable-next-line @typescript-eslint/no-empty-function
const LanguageContext = createContext<LanguageContextType>([DEFAULT_LANG, () => {}])
LanguageContext.displayName = 'Language'

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<Language>(DEFAULT_LANG)
  const user = useGetAuthorizedUserQuery()

  useEffect(() => {
    const userLanguage = user?.language
    if (isLanguage(userLanguage)) {
      setState(userLanguage)
    }
  }, [user?.language])

  return <LanguageContext.Provider value={[state, setState]}>{children}</LanguageContext.Provider>
}

export const useLanguage = () => {
  const [state, setState] = useContext(LanguageContext)
  const [changeLanguage] = useModifyLanguageMutation()

  const getTextIn = useCallback(
    (text: Name | null | undefined, lang?: string): string | null | undefined => {
      if (text == null || Object.values(text).length === 0) {
        return null
      }
      const languageToUse = lang ?? state
      return text[languageToUse] ?? text.fi ?? text.en ?? text.sv ?? Object.values(text)[0]
    },
    [state]
  )

  const setLanguage = async (newLanguage: unknown) => {
    if (!isLanguage(newLanguage)) {
      throw new Error(`Illegal language code ${newLanguage} passed to useLanguage hook!`)
    }

    setState(newLanguage)
    await changeLanguage({ language: newLanguage })
  }

  return {
    language: state,
    setLanguage,
    getTextIn,
  }
}

export type GetTextIn = ReturnType<typeof useLanguage>['getTextIn']
