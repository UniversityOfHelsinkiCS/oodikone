const { requiredGroup } = require('../conf-backend')

const hasRequiredGroup = (hyGroups) => {
  const hasGroup = requiredGroup === null || hyGroups.some(e => e === requiredGroup)
  console.log('has required group?:', hyGroups, requiredGroup, hasGroup)
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
  hasRequiredGroup,
  parseHyGroups
}
