const schema = 'login_schema'
process.env.DB_SCHEMA = schema

const test = require('ava')
const supertest = require('supertest')

const jwt = require('jsonwebtoken')

const userService = require('../../src/services/userService')
const { sequelize } = require('../../src/models')
const { generateUsers } = require('../utils')
const app = require('../../src/app')
const api = supertest(app)

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

test.skip('login does not allow without required headers', async t => {
  const res = api
    .post('/api/login')
    .set({ 'uid': 'uid' })

  const res2 = api
    .post('/api/login')
    .set({ 'shib-session-id': 'sessioniddiibadaaba' })
  const responses = await Promise.all([res, res2])

  responses.forEach(response => t.is(response.status, 401))
})

test.skip('login creates an user', async t => {
  const user = generateUsers(1)[0]

  const res = await api
    .post('/api/login')
    .set({
      uid: user.username,
      'shib-session-id': 'sessioniddiibadaaba',
      'displayname': user.full_name
    })

  t.is(res.status, 200)
  const foundUser = await userService.byUsername(user.username)

  t.is(foundUser.username, user.username, 'Username did not match uid')
  t.is(foundUser.full_name, user.full_name, 'Full name did not match fullname')
})

test.skip('login fetches an user and returns token to enabled', async t => {
  const user = generateUsers(1)[0]
  user.is_enabled = true
  // await User.insertOrUpdate(user) replace with user service equivalent when test is no longer skipped

  const res = await api
    .post('/api/login')
    .set({
      uid: user.username,
      'shib-session-id': 'sessioniddiibadaaba',
      'displayname': user.full_name
    })

  t.is(res.status, 200)
  t.truthy(res.body.token, `Token did not exist in body: ${res.body}`)

  const decodedToken = jwt.decode(res.body.token)
  t.is(decodedToken.userId, user.username, 'user id did not match username')
  t.is(decodedToken.name, user.full_name, 'name did not match full name')
})


test.skip('logout removes token', async t => {
  const user = generateUsers(1)[0]
  await api
    .post('/api/login')
    .set({
      uid: user.username,
      'shib-session-id': 'sessioniddiibadaaba',
      'displayname': user.full_name
    })
    .expect(200)
  
  const res2 = await api
    .delete('/api/logout')
    .expect(200)

  t.falsy(res2.body.token)

  const res3 = await api
    .get('/api/departmentsuccess')
    .expect(403)

  t.is(res3.body.error, 'No token in headers')

})