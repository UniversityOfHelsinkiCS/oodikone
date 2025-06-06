import { maxBy } from 'lodash-es'

export const getLatestSnapshot = entities => {
  return maxBy(
    entities.filter(entity => entity.document_state !== 'DELETED'),
    entity => entity.modification_ordinal
  )
}

export const getActiveSnapshot = entities => {
  const now = new Date()
  return maxBy(
    entities
      .filter(entity => entity.document_state === 'ACTIVE')
      .filter(entity => now >= new Date(entity.snapshot_date_time)),
    entity => new Date(entity.snapshot_date_time)
  )
}

export const getLatestActiveSnapshot = entities => {
  return maxBy(
    entities.filter(entity => entity.document_state == 'ACTIVE'),
    entity => entity.modification_ordinal
  )
}

export const isActive = entity => {
  return entity.document_state === 'ACTIVE'
}

export const isBaMa = education =>
  education.education_type === 'urn:code:education-type:degree-education:bachelors-and-masters-degree'
