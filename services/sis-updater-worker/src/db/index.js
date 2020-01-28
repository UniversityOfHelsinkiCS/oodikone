const { dbConnections } = require('./connection')

const selectStudentsByIds = async ids => dbConnections.knex('persons').whereIn('id', ids)

const selectStudyRightsByPersonIds = async personIds =>
  dbConnections.knex
    .select(dbConnections.knex.raw('array_agg(to_json(studyrights.*)) as studyright'))
    .from('studyrights')
    .whereIn('person_id', personIds)
    .groupBy('id')

const selectAttainmentsByPersonIds = async personIds =>
  dbConnections.knex('attainments').whereIn('person_id', personIds)

const selectTermRegistrationsByPersonIds = async personIds =>
  dbConnections.knex('term_registrations').whereIn('student_id', personIds)

const selectOrganisationsById = async ids =>
  dbConnections.knex
    .select(dbConnections.knex.raw('array_agg(to_json(organisations.*)) as organisation'))
    .from('organisations')
    .whereIn('id', ids)
    .groupBy('id')

module.exports = {
  selectStudentsByIds,
  selectStudyRightsByPersonIds,
  selectAttainmentsByPersonIds,
  selectTermRegistrationsByPersonIds,
  selectOrganisationsById
}
