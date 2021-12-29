const { requiredGroup } = require('../conf-backend')
const _ = require('lodash')

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

const hasRequiredGroup = hyGroups => {
  const hasGroup = requiredGroup === null || _.intersection(hyGroups, requiredGroup).length > 0
  return hasGroup
}

const parseHyGroups = hyGroups => {
  let parsedHyGroups = []
  if (!(hyGroups === undefined || hyGroups === '')) {
    parsedHyGroups = hyGroups.split(';')
  }
  return parsedHyGroups
}

const newLetterBasedCode = /^[A-Za-z]{3,}/ // new letter based codes come first
const oldNumericCode = /^\d/ // old numeric codes come second
const bscCourses = /BSC?(.+?)(?:en|fi|sv)?$/ // bscs courses goes third
const openUniCode = /^AY?(.+?)(?:en|fi|sv)?$/ // open university codes come last
const digi = /DIGI-A?(.+?)(?:en|fi|sv)?$/ // digi-a goes on top courses goes third

const codeRegexes = [digi, openUniCode, oldNumericCode, bscCourses, newLetterBasedCode]

const getSortRank = code => {
  for (let i = 0; i < codeRegexes.length; i++) {
    if (codeRegexes[i].test(code)) {
      return i
    }
  }
  return codeRegexes.length
}

const sortMainCode = codeArray => {
  return codeArray.sort(function (x, y) {
    return getSortRank(y) - getSortRank(x)
  })
}

module.exports = {
  mapToProviders,
  hasRequiredGroup,
  parseHyGroups,
  sortMainCode,
}
