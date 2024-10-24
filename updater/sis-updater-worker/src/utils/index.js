const { maxBy } = require('lodash')

const getLatestSnapshot = entities => {
  return maxBy(
    entities.filter(entity => entity.document_state !== 'DELETED'),
    entity => entity.modification_ordinal
  )
}

const getActiveSnapshot = entities => {
  const now = new Date()
  return maxBy(
    entities
      .filter(entity => entity.document_state === 'ACTIVE')
      .filter(entity => now >= new Date(entity.snapshot_date_time)),
    entity => new Date(entity.snapshot_date_time)
  )
}

const isActive = entity => {
  return entity.document_state === 'ACTIVE'
}

const isBaMa = education =>
  education.education_type === 'urn:code:education-type:degree-education:bachelors-and-masters-degree'

module.exports = {
  getLatestSnapshot,
  isActive,
  isBaMa,
  getActiveSnapshot,
}
