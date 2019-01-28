const supertest = require('supertest')
const jwt = require('jsonwebtoken')
const conf = require('../../src/conf-backend')
const { forceSyncDatabase } = require('../../src/database/connection')

const { sequelize, Teacher, CourseGroup } = require('../../src/models/index')

const uid = 'tktl'
const payload = {
  userId: uid,
  name: '',
  enabled: true,
  admin: true,
  roles: [{
    id: '9',
    group_code: 'coursegroups',
    group_info: 'grants access to course groups'
  }]
}

const token = jwt.sign(payload, conf.TOKEN_SECRET, {
  expiresIn: '24h'
})

const API_PATH = '/api/course-groups'

const MOCK_COURSE_GROUP_ID = 1

const MOCK_ACADEMIC_YEARS = [
  { yearname: '2018-19', semestercode: 160 },
  { yearname: '2017-18', semestercode: 159 },
  { yearname: '2016-17', semestercode: 158 }
]

const MOCK_TEACHER_COURSE_GROUPS = [
  { id: 1, teacher_id: '12345', course_group_id: 1},
]

const MOCK_COURSE_GROUP_STATS = [{
  courses: '10',
  credits: 100,
  students: '20'
}]

const MOCK_COURSE_GROUPS = [
  {
    id: 1,
    name: 'Erityispedagogiikka',
  },
  {
    id: 2,
    name: 'Kasvatuspsykologia',
  },
]

const MOCK_TEACHER_STATS = [{ courses: '10', credits: 100, students: '20', id: '12345' }]
const MOCK_TEACHERS = [{ name: 'testname', code: 'testcode', id: '12345' }]
const MOCK_COURSES = [{
  coursecode: 'EDUK111',
  coursenames:
    { en: 'Bachelor\'s Thesis',
      fi: 'Kandidaatin tutkielma ja seminaari',
      sv: 'Kandidatavhandling och seminarium'
    },
  teachercode: 'testcode',
  teachername: 'testname',
  credits: '10',
  students: 1
},
{
  coursecode: 'EDUK123',
  coursenames:
  {
    en: 'Course',
    fi: 'Kurssi',
    sv: 'kursser'
  },
  teachercode: 'testcode',
  teachername: 'testname',
  credits: 12,
  students: '1'
}]

beforeAll(async () => {
  await forceSyncDatabase()
  CourseGroup.findByPk = jest.fn((id) => Promise.resolve(MOCK_COURSE_GROUPS.find(e => e.id === id)))
  CourseGroup.findAll = jest.fn(() => Promise.resolve(MOCK_COURSE_GROUPS))
  Teacher.findAll = jest.fn(condition =>
    Promise.resolve(
      MOCK_TEACHERS.filter(t =>
        MOCK_TEACHER_COURSE_GROUPS.find(
          tcg =>
            tcg.teacher_id === t.id && tcg.course_group_id === condition.include.where.id
        )
      ).map(e => Teacher.build(e))
    )
  )
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

  jest.mock('../../src/models/queries', () => ({
    __esModule: true,
    getCurrentAcademicYear: jest.fn(() => Promise.resolve([MOCK_ACADEMIC_YEARS[0]])),
    getAcademicYearStatistics: jest.fn(() => Promise.resolve(MOCK_COURSE_GROUP_STATS)),
    getAcademicYearsFrom: jest.fn(() => Promise.resolve(MOCK_ACADEMIC_YEARS)),
    getTeacherAcademicYearStatisticsByIds: jest.fn(() => Promise.resolve(MOCK_TEACHER_STATS)),
    getAcademicYearCoursesByTeacherIds: jest.fn(() => Promise.resolve(MOCK_COURSES))
  }))
})

afterEach(() => {
  jest.clearAllMocks()
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

      const expectedCourseGroups = [
        { credits: 100, id: 1, name: 'Erityispedagogiikka', students: 20 },
        { credits: 0, id: 2, name: 'Kasvatuspsykologia', students: 0 }
      ]

      const res = await supertest(app)
        .get(API_PATH)
        .set('x-access-token', token)
        .set('uid', uid)


      expect(res.status).toBe(200)
      expect(res.body).toEqual(expectedCourseGroups)
      app.close()
    })
  })

  describe('/api/course-groups/:id', () => {
    test('Returns 404 when called with non-existent course group id without semester parameter', async () => {
      const app = require('../../src/app')

      const res = await supertest(app)
        .get(`${API_PATH}/1000`)
        .set('x-access-token', token)
        .set('uid', uid)

      expect(res.status)
        .toBe(404)
      app.close()
    })

    test('Returns 404 when called with non-existent course group id with semester parameter', async () => {
      const app = require('../../src/app')

      const res = await supertest(app)
        .get(`${API_PATH}/1000/?=semester=160`)
        .set('x-access-token', token)
        .set('uid', uid)

      expect(res.status)
        .toBe(404)
      app.close()
    })

    const expectedCourseGroup = {
      id: 1,
      name: 'Erityispedagogiikka',
      teachers: [
        { id: '12345', courses: 10, credits: 100, students: 20, name: 'testname', code: 'testcode' }
      ],
      totalCredits: 100,
      totalStudents: 20,
      totalCourses: 10,
      semester: 160
    }

    test('Returns mocked course group without semester parameter', async () => {
      const app = require('../../src/app')

      const res = await supertest(app)
        .get(`${API_PATH}/${MOCK_COURSE_GROUP_ID}`)
        .set('x-access-token', token)
        .set('uid', uid)

      expect(res.status).toBe(200)
      expect(res.body).toEqual(expectedCourseGroup)
      app.close()
    })

    test('Returns mocked course group with semester parameter', async () => {
      const app = require('../../src/app')

      const res = await supertest(app)
        .get(`${API_PATH}/${MOCK_COURSE_GROUP_ID}?semester=160`)
        .set('x-access-token', token)
        .set('uid', uid)

      expect(res.status).toBe(200)
      expect(res.body).toEqual(expectedCourseGroup)
      app.close()
    })
  })

  describe('/api/course-groups/academic-years', () => {
    test('Returns mocked academic years', async () => {
      const app = require('../../src/app')

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
    const expectedCourses = [
      {
        coursecode: 'EDUK111',
        coursenames:
          { en: 'Bachelor\'s Thesis',
            fi: 'Kandidaatin tutkielma ja seminaari',
            sv: 'Kandidatavhandling och seminarium'
          },
        teachercode: 'testcode',
        teachername: 'testname',
        credits: 10,
        students: 1
      },
      {
        coursecode: 'EDUK123',
        coursenames:
        {
          en: 'Course',
          fi: 'Kurssi',
          sv: 'kursser'
        },
        teachercode: 'testcode',
        teachername: 'testname',
        credits: 12,
        students: 1
      }]

    const teacherIds = ['021314', '021345']

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

    test('Returns mocked courses by teachers list without semester parameter', async () => {
      const app = require('../../src/app')

      const res = await supertest(app)
        .get(`${API_PATH}/courses/?teacherIds=${JSON.stringify(teacherIds)}`)
        .set('x-access-token', token)
        .set('uid', uid)

      expect(res.status).toBe(200)
      expect(res.body).toEqual(expectedCourses)
      app.close()
    })

    test('Returns mocked courses by teachers list with semester parameter', async () => {
      const app = require('../../src/app')

      const res = await supertest(app)
        .get(`${API_PATH}/courses/?teacherIds=${JSON.stringify(teacherIds)}&semester=160`)
        .set('x-access-token', token)
        .set('uid', uid)

      expect(res.status).toBe(200)
      expect(res.body).toEqual(expectedCourses)
      app.close()
    })

    test('Returns empty list with empty teacherIds parameter and semester parameter', async () => {
      const app = require('../../src/app')

      const res = await supertest(app)
        .get(`${API_PATH}/courses/?teacherIds=[]&semester=160`)
        .set('x-access-token', token)
        .set('uid', uid)

      expect(res.status).toBe(200)
      expect(res.body).toEqual([])
      app.close()
    })
  })
})
