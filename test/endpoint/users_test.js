const schema = 'users_schema'
process.env.DB_SCHEMA = schema

const test = require('ava')
const supertest = require('supertest')
const jwt = require('jsonwebtoken')

const { User, Unit, sequelize } = require('../../src/models')
const { generateUsers, generateUnits } = require('../utils.js')
const UserService = require('../../src/services/users')

const app = require('../../src/app')
const conf = require('../../src/conf-backend')
const api = supertest(app)

const uid = 'tktl', fullname = ''
const payload = { userId: uid, name: fullname, admin: true, enabled: true }

const token = jwt.sign(payload, conf.TOKEN_SECRET, {
  expiresIn: '24h'
})

const uid2 = 'notAdmin', fullname2 = ''
const payload2 = { userId: uid2, name: fullname2, admin: false, enabled: true }

const token2 = jwt.sign(payload2, conf.TOKEN_SECRET, {
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

test.skip('all users can be fetched', async t => {
  const res = await api
    .get('/api/users')
    .set('x-access-token', token)
    .set('uid', uid)
    .expect(200)
    .expect('Content-Type', /application\/json/)
  t.is(res.body.length, 5)
})

test.skip('user can be enabled/disabled', async t => {
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


test.skip('user cannot be enabled/disabled if enabler is not admin', async t => {
  const user = await User.findOne({ id: 2 })
  const enabled = user.dataValues.is_enabled
  await api
    .put('/api/users/2/enable')
    .send({ id: 2 })
    .set('x-access-token', token2)
    .set('uid', uid2)
    .expect(403)
  const userAfter = await User.findOne({ id: 2 })
  t.is(userAfter.dataValues.is_enabled, enabled)
})

test.skip('units cannot be added if adder is not admin', async t => {
  const usersUnits = await UserService.getUnits(2)
  await api
    .put('/api/users/2/units/1')
    .send({ uid: 2, id: 1 })
    .set('x-access-token', token2)
    .set('uid', uid2)
    .expect(403)
  const usersUnitsAfter = await UserService.getUnits(2)
  t.is(usersUnitsAfter.length, usersUnits.length)
})

test.skip('units can be added to user', async t => {
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

test.skip('units can be removed from user', async t => {
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