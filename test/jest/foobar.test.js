const nock = require('nock')
const axios = require('axios')
const httpAdapter = require('axios/lib/adapters/http')
const { OODI_ADDR } = require('../../src/conf-backend')
const { updateFaculties } = require('../../src/services/doo_api_database_updater/database_updater')
const { faculties } = require('./test_data')
const { Organisation, sequelize } = require('../../src/models/index')

axios.defaults.adapter = httpAdapter

nock(OODI_ADDR)
  .defaultReplyHeaders({ 'access-control-allow-origin': '*' })
  .get('/codes/faculties')
  .reply(200, {
    data: faculties
  })

const forceSyncDatabase = async () => {
  await sequelize.sync({ force: true })
}

beforeAll(async () => {
  await forceSyncDatabase()
})

test('Database updater saves correct amount of faculties', async () => {
  await updateFaculties()
  const facultiesInDb = await Organisation.findAll()
  expect(facultiesInDb.length).toBe(faculties.length)
})
