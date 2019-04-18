const nock = require('nock')
const axios = require('axios')
const httpAdapter = require('axios/lib/adapters/http')
const { OODI_ADDR } = require('../../../src/conf-backend')
const { updateFaculties } = require('../../../src/services/doo_api_database_updater/database_updater')
const { faculties } = require('./test_data')
const { Organisation } = require('../../../src/models/index')

const configureAxios = () => {
  axios.defaults.adapter = httpAdapter
}

const mockApiGet = (path, data) => {
  nock(OODI_ADDR)
    .defaultReplyHeaders({ 'access-control-allow-origin': '*' })
    .get(path)
    .reply(200, {
      data
    })
}

beforeAll(async () => {
  configureAxios()
})

afterAll(async () => {
})

describe('Database updater for saving faculties', () => {

  let organisation

  beforeAll(async () => {
    mockApiGet('/codes/faculties', faculties)
    await updateFaculties()
    organisation = await Organisation.findByPk('FAC1')
  })

  test('Database updater saves correct amount of faculties', async () => {
    const facultiesInDb = await Organisation.findAll()
    expect(facultiesInDb.length).toBe(faculties.length)
  })

  test('Saved faculty can be found from the database with the faculty code', () => {
    expect(organisation).not.toBeNull()
  })

  test('Saved faculty name in DB is the Finnish name returned by the API', () => {
    expect(organisation.name.fi).toBe('FAC 1 FIN')
  })

})