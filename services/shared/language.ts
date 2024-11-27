export const DEFAULT_LANG = 'fi'
export const LANGUAGE_CODES = ['fi', 'en', 'sv'] as const
export const LANGUAGE_TEXTS = { fi: 'suomi', en: 'English', sv: 'svenska' } as const

export type Language = (typeof LANGUAGE_CODES)[number]

export const isLanguage = (lang: unknown): lang is Language => {
  return typeof lang === 'string' && LANGUAGE_CODES.includes(lang as Language)
}
