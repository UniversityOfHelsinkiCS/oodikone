import { Language } from '@oodikone/shared/language'

export const getCombinedProgrammeName = (bachelor: string, masterLicentiate: string, language: Language) => {
  if (language === 'fi') {
    return `${bachelor} ja ${
      masterLicentiate?.includes('lisensiaatin') ? 'lisensiaatin koulutusohjelma' : 'maisterin koulutusohjelma'
    }`
  }

  if (language === 'en') {
    return `${bachelor?.split(' ')[0]} and ${masterLicentiate}`
  }

  if (language === 'sv') {
    return `${bachelor?.split('programmet')[0]}- och ${masterLicentiate}`
  }

  return bachelor
}
