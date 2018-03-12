const schema = 'courses_schema'
process.env.DB_SCHEMA = schema

const test = require('ava')
const supertest = require('supertest')
const jwt = require('jsonwebtoken')

const { Course, CourseInstance, sequelize } = require('../../src/models')
const { generateCourses, generateCourseInstances } = require('../utils')
const app = require('../../src/app')
const conf = require('../../src/conf-backend')
const api = supertest(app)

const uid = 'tktl', fullname = ''
const payload = { userId: uid, name: fullname }

const token = jwt.sign(payload, conf.TOKEN_SECRET, {
  expiresIn: '24h'
})

test.before(async () => {
  await sequelize.createSchema(schema)
  await sequelize.sync()
})

test.after.always(async () => {
  await sequelize.dropSchema(schema)
})

test('should pong when pinged', async t => {
  const res = await api
    .get('/ping')

  t.is(res.status, 200)
  t.deepEqual(res.body, { data: 'pong' })
})

test('courses can be searched by a searchterm', async t => {
  const courses = await generateCourses()
  const courseInstances = await generateCourseInstances(courses)
  await Course.bulkCreate(courses)
  await CourseInstance.bulkCreate(courseInstances)
  const selectedCourse = courses[0]
  const res = await api
    .get('/api/courses')
    .query({ name: selectedCourse.name })
    .set('x-access-token', token)
    .set('eduPersonPrincipalName', uid)
  t.is(res.status, 200)
  t.truthy(res.body.length > 0, 'res body was empty')
  const foundCourse = res.body.find(course => course.id === selectedCourse.id)
  t.is(selectedCourse.code, Number(foundCourse.code))
  t.is(selectedCourse.name, foundCourse.name)
}) 