const schema = 'users_schema'
process.env.DB_SCHEMA = schema

const test = require('ava')
const supertest = require('supertest')
const jwt = require('jsonwebtoken')

const { User, Unit, sequelize } = require('../../src/models')
const { generateUsers, generateUnits } = require('../utils.js')

const app = require('../../src/app')
const conf = require('../../src/conf-backend')
const api = supertest(app)

const uid = 'tktl', fullname = ''
const payload = { userId: uid, name: fullname, admin: true, enabled: true }

const token = jwt.sign(payload, conf.TOKEN_SECRET, {
  expiresIn: '24h'
})

let users, units

test.before(async () => {
  await sequelize.createSchema(schema)
  await sequelize.sync()
  users = await generateUsers(5)
  units = await generateUnits(3)
  await User.bulkCreate(users)
  await Unit.bulkCreate(units)

})

test.after.always(async () => {
  await sequelize.dropSchema(schema)
})

test('all users can be fetched', async t => {
  const res = await api
    .get('/api/users')
    .set('x-access-token', token)
    .set('uid', uid)
    .expect(200)
    .expect('Content-Type', /application\/json/)
  t.is(res.body.length, 5)
})

test('user can be enabled/disabled', async t => {
  const user = await User.findOne({ id: 1 })
  const enabled = user.dataValues.is_enabled
  const res = await api
    .put('/api/users/1/enable')
    .send({ id: 1 })
    .set('x-access-token', token)
    .set('uid', uid)
    .expect(200)
    .expect('Content-Type', /application\/json/)
  t.is(res.body.is_enabled, !enabled)
})

test.only('units can be added to user', async t => {
  let res = await api
    .post('/api/users/1/units/1')
    .send({ id: 1, uid: 1 })
    .set('x-access-token', token)
    .set('uid', uid)
    .expect(201)
    .expect('Content-Type', /application\/json/)

  t.is(res.body.units.length, 1)

  res = await api
    .post('/api/users/1/units/2')
    .send({ id: 2, uid: 1 })
    .set('x-access-token', token)
    .set('uid', uid)
    .expect(201)
    .expect('Content-Type', /application\/json/)

  t.is(res.body.units.length, 2)
})

test.only('units can be removed from user', async t => {
  let res = await api
    .post('/api/users/2/units/1')
    .send({ id: 1, uid: 1 })
    .set('x-access-token', token)
    .set('uid', uid)
    .expect(201)
    .expect('Content-Type', /application\/json/)

  t.is(res.body.units.length, 1)

  res = await api
    .delete('/api/users/2/units/1')
    .set('x-access-token', token)
    .set('uid', uid)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  t.is(res.body.units.length, 0)
})


test('should pong when pinged', async t => {
  const res = await api
    .get('/ping')

  t.is(res.status, 200)
  t.deepEqual(res.body, { data: 'pong' })
})