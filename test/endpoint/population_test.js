const schema = 'population_schema'
process.env.DB_SCHEMA = schema

const test = require('ava')
const supertest = require('supertest')
const jwt = require('jsonwebtoken')
const moment = require('moment')

const { Unit, Organisation, Student, Studyright, sequelize } = require('../../src/models')
const { generateUnits, generateOrganizations, generateStudents, generateStudyrights } = require('../utils')

const app = require('../../src/app')
const conf = require('../../src/conf-backend')
const api = supertest(app)

const uid = 'tktl', fullname = ''
const payload = { userId: uid, name: fullname, enabled: true }

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


test('populations can be searched by a searchterm', async t => {
  const res = await api
    .get('/api/studyrightkeywords')
    .query({ search: 'computer Science' })
    .set('x-access-token', token)
    .set('uid', uid)

  t.is(res.status, 200)
  t.is(res.body.length, 40)
  t.truthy(res.body.every(r => r.toUpperCase().includes('COMPUTER SCIENCE')))
})

test('enrollment dates can be fetched', async t => {
  const res = await api
    .get('/api/enrollmentdates')
    .set('x-access-token', token)
    .set('uid', uid)

  t.is(res.status, 200)
  t.is(res.body.length, 722)
  t.truthy(res.body.includes('2014-09-02'))
})

test('new api populations can be fetched', async t => {
  const students = await generateStudents()
  const organizations = await generateOrganizations()
  const date = moment('05/05/2010', 'DD/MM/YYYY').toDate().toUTCString()
  const studyrights = await generateStudyrights(students, organizations, 1, date, 1)
  const units = generateUnits(null, studyrights)

  await Student.bulkCreate(students)
  await Organisation.bulkCreate(organizations)
  await Studyright.bulkCreate(studyrights)
  await Unit.bulkCreate(units)
  
  const unitsWithIds = await Unit.findAll()
  const unit = unitsWithIds.find(unit => units.find(u => u.name === unit.name))

  const res = await api
    .get('/api/populationstatistics')
    .query({
      year: '2010',
      semester: 'SPRING',
      studyRights: unit.id
    })
    .set('x-access-token', token)
    .set('uid', uid)

  t.is(res.status, 200)
  const stats = res.body
  t.is(stats.length, students.length, `Stats length did not match students ${JSON.stringify(stats)}`)

})

test.skip('multiple population studyrights can be fetched', async t => {
  const res = await api
    .get('/api/populationstatistics')
    .query({
      year: '2010',
      semester: 'SPRING',
      studyRights: ['2', '1']
    })
    .set('x-access-token', token)
    .set('uid', uid)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  const stats = res.body
  t.is(stats.length, 19)

})

test.skip('population statics with wrong semester results in bad request', async t => {
  const res = await api
    .get('/api/populationstatistics')
    .query({
      year: '2010',
      semester: 'NO SEASON',
      studyRights: '500-K005'
    })
    .set('x-access-token', token)
    .set('uid', uid)
    .expect(400)
    .expect('Content-Type', /application\/json/)

  const stats = res.body
  t.is(stats.error, 'Semester should be either SPRING OR FALL')

})

test.skip('population statics with wrong semester results in bad request', async t => {
  const res = await api
    .get('/api/populationstatistics')
    .query({
      year: '2010',
      semester: 'SPRING',
      studyRights: '[Huolissaanolon maisteriohjelma, 500-K005]'
    })
    .set('x-access-token', token)
    .set('uid', uid)
    .expect(400)
    .expect('Content-Type', /application\/json/)

  const stats = res.body
  t.is(stats.error, 'No such study rights: [Huolissaanolon maisteriohjelma, 500-K005]')

})

test.skip('population statics without a proper queryresults in bad request', async t => {
  const res = await api
    .get('/api/populationstatistics')
    .query({ myName: 'Jeff' })
    .set('x-access-token', token)
    .set('uid', uid)
    .expect(400)
    .expect('Content-Type', /application\/json/)

  const stats = res.body
  t.is(stats.error, 'The query should have a year, semester and study rights defined')

})