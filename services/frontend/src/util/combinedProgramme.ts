import { Language } from '@oodikone/shared/language'

export const getCombinedProgrammeName = (bachelor: string, masterLicentiate: string, language: Language) => {
  switch (language) {
    // If language happens to be anything else than fi, en or sv, return finnish
    case 'fi':
    default:
      return `${bachelor} ja ${
        masterLicentiate?.includes('lisensiaatin') ? 'lisensiaatin koulutusohjelma' : 'maisterin koulutusohjelma'
      }`

    case 'en':
      return `${bachelor?.split(' ')[0]} and ${masterLicentiate}`

    case 'sv':
      return `${bachelor?.split('programmet')[0]}- och ${masterLicentiate}`
  }
}
