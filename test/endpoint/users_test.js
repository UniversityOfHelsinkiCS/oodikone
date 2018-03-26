const schema = 'users_schema'
process.env.DB_SCHEMA = schema

const test = require('ava')
const supertest = require('supertest')
const jwt = require('jsonwebtoken')

const { User, sequelize } = require('../../src/models')
const { generateUsers } = require('../utils.js')

const app = require('../../src/app')
const conf = require('../../src/conf-backend')
const api = supertest(app)

const uid = 'tktl', fullname = ''
const payload = { userId: uid, name: fullname }

const token = jwt.sign(payload, conf.TOKEN_SECRET, {
  expiresIn: '24h'
})

let users

test.before(async () => {
  await sequelize.createSchema(schema)
  await sequelize.sync()
  users = await generateUsers(5)
  await User.bulkCreate(users)

})

test.after.always(async () => {
  await sequelize.dropSchema(schema)
})

test('all users can be fetched', async t => {
  const res = await api
    .get('/api/users')
    .set('x-access-token', token)
    .expect(200)
    .expect('Content-Type', /application\/json/)
  t.is(res.body.length, 5)
})

test('user can be enabled/disabled', async t => {
  let user = await User.findOne({ id: 1 })
  const enabled = user.dataValues.is_enabled
  const res = await api
    .post('/api/users/enable')
    .send({ id: 1 })
    .set('x-access-token', token)
    .expect(200)
    .expect('Content-Type', /application\/json/)
  t.is(res.body.is_enabled, !enabled)
})


test('should pong when pinged', async t => {
  const res = await api
    .get('/ping')

  t.is(res.status, 200)
  t.deepEqual(res.body, { data: 'pong' })
})