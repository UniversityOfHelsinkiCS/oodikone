const { dbConnections } = require('./connection')
const { getLatestSnapshot, isActive } = require('../utils')

const selectFromByIds = async (table, ids, col = 'id') => dbConnections.knex(table).whereIn(col, ids)

const selectAllFrom = async table => dbConnections.knex(table)

const selectFromSnapshotsByIds = async (table, ids, col = 'id') =>
  (
    await dbConnections.knex
      .select(dbConnections.knex.raw(`array_agg(to_json(${table}.*)) as data`))
      .from(table)
      .whereIn(col, ids)
      .groupBy('id')
  )
    .map(({ data }) => getLatestSnapshot(data))
    .filter(isActive)

const getColumnsToUpdate = (model, keys) => Object.keys(model.rawAttributes).filter(a => !keys.includes(a))

const bulkCreate = async (model, entities, transaction = null, properties = ['id']) => {
  await model.bulkCreate(entities, {
    updateOnDuplicate: getColumnsToUpdate(model, properties),
    transaction
  })
}

module.exports = {
  selectFromByIds,
  selectFromSnapshotsByIds,
  bulkCreate,
  selectAllFrom
}
