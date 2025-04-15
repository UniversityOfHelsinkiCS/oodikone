const { getLatestSnapshot, isActive, getActiveSnapshot, getLatestActiveSnapshot } = require('../utils')
const { logger } = require('../utils/logger')
const { dbConnections } = require('./connection')

const selectOneById = async (table, id, col = 'id') => dbConnections.knex(table).where(col, id).first()

const selectFromByIds = async (table, ids, col = 'id') => dbConnections.knex(table).whereIn(col, ids)

const selectFromByIdsOrderBy = async (table, ids, col = 'id', by, order = 'asc') =>
  dbConnections.knex(table).whereIn(col, ids).orderBy(by, order)

const selectAllFrom = async table => dbConnections.knex(table)

const selectAllFromSnapshots = async table =>
  (
    await dbConnections.knex
      .select(dbConnections.knex.raw(`array_agg(to_json(${table}.*)) as data`))
      .from(table)
      .groupBy('id')
  )
    .map(({ data }) => getLatestSnapshot(data))
    .filter(s => !!s)
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

const selectLatestActiveFromSnapshotsByIds = async (table, ids, col = 'id') =>
  (
    await dbConnections.knex
      .select(dbConnections.knex.raw(`array_agg(to_json(${table}.*)) as data`))
      .from(table)
      .whereIn(col, ids)
      .groupBy('id')
  )
    .map(({ data }) => getLatestActiveSnapshot(data))
    .filter(s => !!s)

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

const bulkCreate = async (
  model,
  entities,
  transaction = null,
  properties = ['id'],
  upsertStyle = true,
  findBy = 'id'
) => {
  try {
    const options = upsertStyle
      ? { updateOnDuplicate: getColumnsToUpdate(model, properties), transaction }
      : { ignoreDuplicates: true, transaction }
    await model.bulkCreate(entities, options)
  } catch (error) {
    for (const entity of entities) {
      try {
        if (upsertStyle) await model.upsert(entity, { fields: getColumnsToUpdate(model, properties) })
        else {
          const whereClause = {}
          whereClause[findBy] = entity[findBy]
          await model.findOrCreate({
            where: whereClause,
            defaults: entity,
          })
        }
      } catch (error) {
        logger.error(`Single-entity upsert failed. ${error.name?.startsWith('Sequelize') ? error.toString() : ''}`, {
          error,
          entity,
        })
      }
    }
  }
}

const getCourseUnitsByCodes = codes => dbConnections.knex('course_units').whereIn('code', codes).select('*')

module.exports = {
  selectOneById,
  selectFromByIds,
  selectFromByIdsOrderBy,
  selectFromSnapshotsByIds,
  bulkCreate,
  selectAllFrom,
  selectAllFromSnapshots,
  getCourseUnitsByCodes,
  selectFromActiveSnapshotsByIds,
  selectLatestActiveFromSnapshotsByIds,
}
