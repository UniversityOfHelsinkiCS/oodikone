const { requiredGroup } = require('../conf-backend')

const mapToProviders = elementDetails => elementDetails.map((r) => {
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

const hasRequiredGroup = (hyGroups) => {
  const hasGroup = requiredGroup === null || hyGroups.some(e => e === requiredGroup)
  return hasGroup
}

const parseHyGroups = (hyGroups) => {
  let parsedHyGroups = []
  if (!(hyGroups === undefined || hyGroups === '')) {
    parsedHyGroups = hyGroups.split(';')
  }
  return parsedHyGroups
}

module.exports = {
  mapToProviders,
  hasRequiredGroup,
  parseHyGroups
}
