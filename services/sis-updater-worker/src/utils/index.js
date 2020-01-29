const { maxBy } = require('lodash')

const getLatestSnapshot = entities => {
  return maxBy(entities, e => e.modification_ordinal)
}

const isActive = entity => {
  return entity.document_state === 'ACTIVE'
}

module.exports = {
  getLatestSnapshot,
  isActive
}
