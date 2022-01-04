const mapToProviders = elementDetails =>
  elementDetails.map(r => {
    const isNumber = str => !Number.isNaN(Number(str))
    if (r.includes('_')) {
      const [left, right] = r.split('_')
      const prefix = [...left].filter(isNumber).join('')
      const suffix = `${left[0]}${right}`
      const providercode = `${prefix}0-${suffix}`
      return providercode
    }
    return r
  })

const newLetterBasedCode = /^[A-Za-z]{3,}/ // new letter based codes come first
const oldNumericCode = /^\d/ // old numeric codes come second
const openUniCode = /^AY?(.+?)(?:en|fi|sv)?$/ // open university codes come last
const openUniCodeA = /A\d/ // open university with just A come last
const digi = /DIGI-A?(.+?)(?:en|fi|sv)?$/ // digi-a goes on top courses goes third

const codeRegexes = [openUniCodeA, openUniCode, oldNumericCode, newLetterBasedCode, digi]

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
