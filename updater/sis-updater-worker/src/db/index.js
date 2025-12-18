import { getLatestSnapshot, isActive, getActiveSnapshot, getLatestActiveSnapshot } from '../utils/index.js'
import logger from '../utils/logger.js'
import { dbConnections } from './connection.js'

/**
 * @param {string} table - Table this function is trying to query against
 * @param {string} id - Single id
 * @param {string} [col] - Id column in the table
 *
 * @returns {Promise<T>} Where T is the query result object
 */
export const selectOneById = async (table, id, col = 'id') => dbConnections.knex(table).where(col, id).first()

/**
 * @param {string} table - Table this function is trying to query against
 * @param {string} id - Single id
 * @param {string} [col] - Id column in the table
 *
 * @returns {Promise<T>} Where T is the query result object
 */
export const selectLastById = async (table, id, col = 'id') => (await dbConnections.knex(table).where(col, id)).at(-1)

/**
 * @param {string} table - Table this function is trying to query against
 * @param {string[]} ids - Array of ids
 * @param {string} [col] - Id column in the table
 *
 * @returns {Promise<T[]>} Where T is the query result object
 */
export const selectFromByIds = async (table, ids, col = 'id') => dbConnections.knex(table).whereIn(col, ids)

/**
 * @param {string} table - Table this function is trying to query against
 * @param {string[]} ids - Array of ids
 * @param {string} [col] - Id column in the table
 * @param {string} [by]  - Column the result will be sorted by
 * @param {string} [order] - The order the sort column will be sorted in
 *
 * @returns {Promise<T[]>} Where T is the query result object
 */
export const selectFromByIdsOrderBy = async (table, ids, col = 'id', by = 'id', order = 'asc') =>
  dbConnections.knex(table).whereIn(col, ids).orderBy(by, order)

/**
 * @param {string} table - Table this function is trying to query against
 *
 * @returns {Promise<T[]>} Where T is the query result object
 */
export const selectAllFrom = async table => dbConnections.knex(table)

/**
 * @param {string} table - Table this function is trying to query against
 *
 * @returns {Promise<T[]>} Where T is the query result object
 */
export const selectAllFromSnapshots = async table =>
  (
    await dbConnections.knex
      .select(dbConnections.knex.raw(`array_agg(to_json(${table}.*)) as data`))
      .from(table)
      .groupBy('id')
  )
    .map(({ data }) => getLatestSnapshot(data))
    .filter(s => !!s)
    .filter(isActive)

/**
 * @param {string} table - Table this function is trying to query against
 * @param {string[]} ids - Array of ids
 * @param {string} [col] - Id column in the table
 *
 * @returns {Promise<T[]>} Where T is the query result object
 */
export const selectFromSnapshotsByIds = async (table, ids, col = 'id') =>
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

/**
 * @param {string} table - Table this function is trying to query against
 * @param {string[]} ids - Array of ids
 * @param {string} [col] - Id column in the table
 *
 * @returns {Promise<T[]>} Where T is the query result object
 */
export const selectLatestActiveFromSnapshotsByIds = async (table, ids, col = 'id') =>
  (
    await dbConnections.knex
      .select(dbConnections.knex.raw(`array_agg(to_json(${table}.*)) as data`))
      .from(table)
      .whereIn(col, ids)
      .groupBy('id')
  )
    .map(({ data }) => getLatestActiveSnapshot(data))
    .filter(s => !!s)

/**
 * @param {string} table - Table this function is trying to query against
 * @param {string[]} ids - Array of ids
 * @param {string} [col] - Id column in the table
 *
 * @returns {Promise<T[]>} Where T is the query result object
 */
export const selectFromActiveSnapshotsByIds = async (table, ids, col = 'id') =>
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

/**
 * @param {import('sequelize').Model<T>} model - Model for the bulkCreate
 * @param {import('sequelize').InferCreationAttributes<model>[]} entities - Model creation entity array
 * @param {?import('sequelize').Transaction} [transaction] - Query transaction type
 * @param {string[]} [properties] - Columns used for bulkCreate
 * @param {boolean} [upsertStyle] - Use upsert for the creation
 * @param {string} [findBy] - If upsertStyle is false, use findBy to findOrCreate
 */
export const bulkCreate = async (
  model,
  entities,
  transaction = null,
  properties = ['id'],
  upsertStyle = true,
  findBy = 'id'
) => {
  try {
    /** @type {import('sequelize').BulkCreateOptions<model>} */
    const options = upsertStyle
      ? { updateOnDuplicate: getColumnsToUpdate(model, properties), transaction }
      : { ignoreDuplicates: true, transaction }
    await model.bulkCreate(entities, options)
  } catch (_error) {
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
