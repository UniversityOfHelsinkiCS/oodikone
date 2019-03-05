const { requiredGroup } = require('../conf-backend')

const hasRequiredGroup = (hyGroups) => {
  return requiredGroup === null || hyGroups.some(e => e === requiredGroup)
}

const parseHyGroups = (hyGroups) => {
  let parsedHyGroups = []
  if (!(hyGroups === undefined || hyGroups === '')) {
    parsedHyGroups = hyGroups.split(';')
  }
  return parsedHyGroups
}

module.exports = {
  hasRequiredGroup,
  parseHyGroups
}
