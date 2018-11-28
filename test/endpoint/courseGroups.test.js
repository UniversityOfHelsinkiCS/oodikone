const supertest = require('supertest')
const jwt = require('jsonwebtoken')

const conf = require('../../src/conf-backend')
const { forceSyncDatabase } = require('../../src/database/connection')

const { sequelize } = require('../../src/models/index')

const uid = 'tktl'
const payload = { userId: uid, name: '', enabled: true, admin: true }

const token = jwt.sign(payload, conf.TOKEN_SECRET, {
  expiresIn: '24h'
})

beforeAll(async () => {
  await forceSyncDatabase()
})

afterAll(async () => {
  await sequelize.close()
})

describe('Course groups endpoint tests', () => {
  test('Ping test', async () => {
    const app = require('../../src/app')
    const res = await supertest(app)
      .get('/ping')

    expect(res.status).toBe(200)
    app.close()
  })

  test('Get list of available course groups', async () => {
    const app = require('../../src/app')
    const res = await supertest(app)
      .get('/api/courseGroups')
      .set('x-access-token', token)
      .set('uid', uid)

    expect(res.status).toBe(200)
    expect(res.body).toEqual([
      { id: 1, name: 'Erityispedagogiikka', credits: null, students: 0 },
      { id: 2, name: 'Kasvatuspsykologia', credits: null, students: 0 }
    ])
    app.close()
  })

  test('Get teachers for course group', async () => {
    const app = require('../../src/app')
    const res = await supertest(app)
      .get('/api/courseGroups/1/teachers')
      .set('x-access-token', token)
      .set('uid', uid)

    expect(res.status).toBe(200)
    expect(res.body.length).toBe(8)
    app.close()
  })
})
