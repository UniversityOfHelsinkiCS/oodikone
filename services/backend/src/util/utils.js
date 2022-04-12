const mapToProviders = elementDetails => {
  return elementDetails.map(r => {
    const isNumber = str => !Number.isNaN(Number(str))
    if (r.includes('_')) {
      const [left, right] = r.split('_')
      const prefix = [...left].filter(isNumber).join('')
      const suffix = `${left[0]}${right}`
      const providercode = `${prefix}0-${suffix}`
      return providercode
    }
    if (/^(T)[0-9]{6}$/.test(r)) {
      const numbers = r.substring(1)
      return `7${numbers}`
    }
    return r
  })
}

// sort substitutions so that main code is first
const newLetterBasedCode = /^[A-Za-z]/ // new letter based codes come first
const oldNumericCode = /^\d/ // old numeric codes come second
const openUniCode = /^AY?(.+?)(?:en|fi|sv)?$/ // open university codes come last
const openUniCodeA = /A\d/ // open university with just A come last
const digi = /DIGI-A?(.+?)(?:en|fi|sv)?$/ // digi-a goes on top courses goes third
const bscsCode = /BSCS??/

const codeRegexes = [openUniCodeA, openUniCode, bscsCode, oldNumericCode, newLetterBasedCode, digi]

const getSortRank = code => {
  for (let i = 0; i < codeRegexes.length; i++) {
    if (codeRegexes[i].test(code)) {
      return i
    }
  }
  return 3 // if no hit, put before open uni courses
}

const sortMainCode = codeArray => {
  if (!codeArray) return []
  return codeArray.sort(function (x, y) {
    return getSortRank(y) - getSortRank(x)
  })
}

module.exports = {
  mapToProviders,
  sortMainCode,
  getSortRank,
}
