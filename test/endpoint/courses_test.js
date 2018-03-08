process.env.DB_SCHEMA = 'courses_schema'

const test = require('ava')
const supertest = require('supertest')
const jwt = require('jsonwebtoken')

// const generateCourses = require('../utils')
const app = require('../../src/app')
const conf = require('../../src/conf-backend')
const api = supertest(app)

const uid = 'tktl', fullname = ''
const payload = { userId: uid, name: fullname }

const token = jwt.sign(payload, conf.TOKEN_SECRET, {
  expiresIn: '24h'
})

test.before(async () => {
  
})

test('should pong when pinged', async t => {
  const res = await api
    .get('/ping')

  t.is(res.status, 200)
  t.deepEqual(res.body, { data: 'pong' })
})
/*
test('courses can be searched by a searchterm', async t => {
  const res = await api
    .get('/api/courses')
    .query({ name: 'Ohjelmoinnin' })
    .set('x-access-token', token)
    .set('eduPersonPrincipalName', uid)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  const courses = res.body

  t.is(courses.length, 10)
  const courseNames = courses.map(c => c.name.toUpperCase())

  t.truthy(courseNames.every(n => n.includes('Ohjelmoinnin'.toUpperCase())))
}) */