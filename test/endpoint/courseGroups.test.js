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

const API_PATH = '/api/course-groups'

const MOCK_ACADEMIC_YEARS = [
  { yearname: '2018-19', semestercode: 160 },
  { yearname: '2017-18', semestercode: 159 },
  { yearname: '2016-17', semestercode: 158 }
]

beforeAll(async () => {
  await forceSyncDatabase()
})

afterAll(async () => {
  await sequelize.close()
})

beforeEach(() => {
  jest.mock('../../src/services/redis', () => ({
    __esModule: true,
    redisClient: {
      getAsync: jest.fn(() => Promise.resolve()),
      setAsync: jest.fn(() => Promise.resolve())
    }
  }))
})

afterEach(() => {
  jest.resetAllMocks()
})


describe('Course groups endpoint tests', () => {
  test('Ping test', async () => {
    const app = require('../../src/app')
    const res = await supertest(app)
      .get('/ping')

    expect(res.status).toBe(200)
    app.close()
  })

  describe('/api/course-groups', () => {
    test('Returns list of mocked course groups', async () => {
      const app = require('../../src/app')

      const expectedCourseGroups = [{
        credits: null,
        id: 1,
        name: 'Erityispedagogiikka',
        students: 0
      },
      {
        credits: null,
        id: 2,
        name: 'Kasvatuspsykologia',
        students: 0
      }
      ]

      sequelize.query = jest.fn(() => Promise.resolve(expectedCourseGroups))

      const res = await supertest(app)
        .get(API_PATH)
        .set('x-access-token', token)
        .set('uid', uid)


      expect(res.status).toBe(200)
      expect(res.body).toEqual(expectedCourseGroups)
      app.close()
    })
  })

  describe('/api/course-groups/academic-years', () => {
    test('Returns mocked academic years', async () => {
      const app = require('../../src/app')

      sequelize.query = jest.fn(() => Promise.resolve(MOCK_ACADEMIC_YEARS))

      const res = await supertest(app)
        .get(`${API_PATH}/academic-years`)
        .set('x-access-token', token)
        .set('uid', uid)

      expect(res.status).toBe(200)
      expect(res.body).toEqual(MOCK_ACADEMIC_YEARS)
      app.close()
    })
  })

  describe('/api/course-groups/courses', () => {
    test('Returns 400 bad request when called without teacherIds parameter', async () => {
      const app = require('../../src/app')

      const res = await supertest(app)
        .get(`${API_PATH}/courses`)
        .set('x-access-token', token)
        .set('uid', uid)

      expect(res.status).toBe(400)
      app.close()
    })

    test('Returns 400 bad request when called with non-array teacherIds parameter', async () => {
      const app = require('../../src/app')

      const res = await supertest(app)
        .get(`${API_PATH}/courses/?teacherIds=21314`)
        .set('x-access-token', token)
        .set('uid', uid)

      expect(res.status).toBe(400)
      app.close()
    })

    test('Returns mocked courses by teachers list', async () => {
      const app = require('../../src/app')

      const expectedTeachers = [
        { coursecode: 'EDUK111',
          coursenames:
            { en: "Bachelor's Thesis",
              fi: 'Kandidaatin tutkielma ja seminaari',
              sv: 'Kandidatavhandling och seminarium'
            },
          teachercode: 'testio',
          teachername: 'testi test testila',
          credits: 10,
          students: 1 },
        { coursecode: 'EDUK123',
          coursenames:
            { en: "Course",
              fi: 'Kurssi',
              sv: 'kursser'
            },
          teachercode: 'testi2',
          teachername: 'toinen to testi',
          credits: 12,
          students: 1 }]

      sequelize.query = jest.fn()
      sequelize.query.mockReturnValueOnce(Promise.resolve(MOCK_ACADEMIC_YEARS))
      sequelize.query.mockReturnValueOnce(Promise.resolve(expectedTeachers))

      const ids = ['021314', '021345']

      const res = await supertest(app)
        .get(`${API_PATH}/courses/?teacherIds=${JSON.stringify(ids)}`)
        .set('x-access-token', token)
        .set('uid', uid)

      expect(res.status).toBe(200)
      expect(res.body).toEqual(expectedTeachers)
      app.close()
    })
  })
})
