const { chunk } = require('lodash')
const { eachLimit } = require('async')
const { dbConnections } = require('./connection')
const { logger } = require('../utils/logger')
const { getLatestSnapshot, isActive, getActiveSnapshot } = require('../utils')

const selectFromByIds = async (table, ids, col = 'id') => dbConnections.knex(table).whereIn(col, ids)

const selectFromByIdsOrderBy = async (table, ids, col = 'id', by, order = 'asc') =>
  dbConnections.knex(table).whereIn(col, ids).orderBy(by, order)

const selectAllFrom = async table => dbConnections.knex(table)

const selectWithoutNull = notNullCol => {
  return async query => query.whereNotNull(notNullCol)
}

const selectColumnsFrom = (table, cols) => dbConnections.knex(table).select(cols)

const selectAllFromSnapshots = async table =>
  (
    await dbConnections.knex
      .select(dbConnections.knex.raw(`array_agg(to_json(${table}.*)) as data`))
      .from(table)
      .groupBy('id')
  )
    .map(({ data }) => getLatestSnapshot(data))
    .filter(isActive)

const selectFromSnapshotsByIds = async (table, ids, col = 'id') =>
  (
    await dbConnections.knex
      .select(dbConnections.knex.raw(`array_agg(to_json(${table}.*)) as data`))
      .from(table)
      .whereIn(col, ids)
      .groupBy('id')
  )
    .map(({ data }) => getLatestSnapshot(data))
    .filter(s => !!s)
    .filter(isActive)

const selectFromActiveSnapshotsByIds = async (table, ids, col = 'id') =>
  (
    await dbConnections.knex
      .select(dbConnections.knex.raw(`array_agg(to_json(${table}.*)) as data`))
      .from(table)
      .whereIn(col, ids)
      .groupBy('id')
  )
    .map(({ data }) => getActiveSnapshot(data))
    .filter(s => !!s)

const getColumnsToUpdate = (model, keys) => Object.keys(model.rawAttributes).filter(a => !keys.includes(a))

const bulkCreate = async (model, entities, transaction = null, properties = ['id']) => {
  try {
    await model.bulkCreate(entities, {
      updateOnDuplicate: getColumnsToUpdate(model, properties),
      transaction,
    })
  } catch (e) {
    if (entities.length === 1) {
      logger.error({ message: e.message, meta: { stack: e.stack, entity: entities[0] } })
      return
    }

    const chunks = chunk(entities, Math.floor(entities.length / 2))
    await eachLimit(chunks, 1, async c => await bulkCreate(model, c, transaction, properties))
  }
}

const getCourseUnitsByCodes = codes => dbConnections.knex('course_units').whereIn('code', codes).select('*')

module.exports = {
  selectFromByIds,
  selectFromByIdsOrderBy,
  selectFromSnapshotsByIds,
  bulkCreate,
  selectAllFrom,
  selectAllFromSnapshots,
  selectColumnsFrom,
  selectWithoutNull,
  getCourseUnitsByCodes,
  selectFromActiveSnapshotsByIds,
}
