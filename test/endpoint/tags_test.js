const schema = 'tags_schema'
process.env.DB_SCHEMA = schema

const test = require('ava')
const supertest = require('supertest')
const jwt = require('jsonwebtoken')

const { Student, Tag, TagStudent, sequelize } = require('../../src/models')
const { generateTags, generateStudents, generateTagStudents } = require('../utils')

const app = require('../../src/app')
const conf = require('../../src/conf-backend')
const api = supertest(app)

const uid = 'tktl', fullname = ''
const payload = { userId: uid, name: fullname, enabled: true }

const token = jwt.sign(payload, conf.TOKEN_SECRET, {
  expiresIn: '24h'
})

let students, tags, tagStudents

test.before(async () => {
  await sequelize.createSchema(schema)
  await sequelize.sync()

  students = await generateStudents(4)
  tags = await generateTags(6)
  tagStudents = await generateTagStudents(students, tags.slice(0, 5))
  await Student.bulkCreate(students)
  await Tag.bulkCreate(tags)
  await TagStudent.bulkCreate(tagStudents)
})

test.after.always(async () => {
  await sequelize.dropSchema(schema)
})

test('all tags can be fetched', async t => {
  const res = await api
    .get('/api/tags')
    .set('x-access-token', token)
    .set('uid', uid)
    .expect(200)
    .expect('Content-Type', /application\/json/)
  t.is(res.body.length, 6)
})

test('should pong when pinged', async t => {
  const res = await api
    .get('/ping')

  t.is(res.status, 200)
  t.deepEqual(res.body, { data: 'pong' })
})