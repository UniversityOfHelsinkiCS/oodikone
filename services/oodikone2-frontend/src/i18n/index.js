import { AVAILABLE_LANGUAGES } from '../constants'

const getTranslation = (strMap, requestedLang) => {
  if (strMap) {
    return strMap[requestedLang] ||
      strMap[AVAILABLE_LANGUAGES[0]] ||
      AVAILABLE_LANGUAGES
        .filter(l => strMap[l])
        .map(l => strMap[l])
        .shift()
  }

  return null
}

export default getTranslation
