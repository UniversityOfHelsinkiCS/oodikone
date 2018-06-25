const nock = require('nock')
const axios = require('axios')
const httpAdapter = require('axios/lib/adapters/http')
const { OODI_ADDR } = require('../../src/conf-backend')
const { updateFaculties } = require('../../src/services/doo_api_database_updater/database_updater')
const { faculties } = require('./test_data')
const { Organisation, sequelize } = require('../../src/models/index')

axios.defaults.adapter = httpAdapter  

const mockApiGet = (path, data) => {
  nock(OODI_ADDR)
    .defaultReplyHeaders({ 'access-control-allow-origin': '*' })
    .get(path)
    .reply(200, {
      data
    })
}

const forceSyncDatabase = async () => {
  await sequelize.sync({ force: true })
}

beforeAll(async () => {
  await forceSyncDatabase()
})

afterAll(async () => {
  await sequelize.close()
})

describe('Database updater for saving faculties', () => {

  beforeAll(() => {
    mockApiGet('/codes/faculties', faculties)
  })

  test('Database updater saves correct amount of faculties', async () => {
    await updateFaculties()
    const facultiesInDb = await Organisation.findAll()
    expect(facultiesInDb.length).toBe(faculties.length)
  })

})