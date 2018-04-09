const test = require('ava')
const supertest = require('supertest')
const app = require('../../src/app')
const api = supertest(app)
const { sequelize } = require('../../src/models')
const conf = require('../../src/conf-backend')
const jwt = require('jsonwebtoken')

/*
const auth = {
  username: 'tktl',
  password: 'CsZerc8TUtR1S95CYOtTaC69'
}
*/

let token
const uid = 'tktl', fullname = ''
const payload = { userId: uid, name: fullname }

test.before(async () => {
  token = jwt.sign(payload, conf.TOKEN_SECRET, {
    expiresIn: '24h'
  })
  //console.log(token)
  sequelize.query(
    `DELETE 
      FROM tag_student 
      WHERE tags_tagname = 'test3'`
  )
})

test.after.always(async () => {
  const tagToAdd = { text: 'mooc-2013' }
  console.log('ennd  bfefore')

  let res = await api
    .delete('/api/students/014424850/tags')
    .send(tagToAdd)
    .set('x-access-token', token)
    .set('eduPersonPrincipalName', uid)
})

test('should pong when pinged', async t => {
  const res = await api
    .get('/ping')
    .expect(200)
    .expect('Content-Type', /application\/json/)

  t.deepEqual(res.body, { data: 'pong' })
})

test('request with correct credentials succeed', async t => {
  await api
    .get('/api/enrollmentdates')
    .set('x-access-token', token)
    .set('eduPersonPrincipalName', uid)
    //.auth(auth.username, auth.password)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  t.pass()
})

test('students can be searched by searchterm', async t => {
  const res = await api
    .get('/api/students')
    .query({ searchTerm: 'Luukkainen Matti' })
    .set('x-access-token', token)
    .set('eduPersonPrincipalName', uid)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  const students = res.body
  t.is(students.length, 1)
  t.is(students[0].studentNumber, '011120775')
})

test('a student credit info is returned with student number', async t => {
  const res = await api
    .get('/api/students/011120775')
    .set('x-access-token', token)
    .set('eduPersonPrincipalName', uid)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  const student = res.body

  t.is(student.studentNumber, '011120775')
  t.is(student.credits, 514)
  t.is(student.courses.length, 86)
  t.is(student.tags.length, 0)
})

test('a tagless student credit info is returned with student number', async t => {
  const res = await api
    .get('/api/students/014424850')
    .set('x-access-token', token)
    .set('eduPersonPrincipalName', uid)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  const student = res.body
  console.log(student.tags)
  t.is(student.studentNumber, '014424850')
  t.is(student.credits, 181)
  t.is(student.tags.length, 3)
})

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
})

test('populations can be searched by a searchterm', async t => {
  const res = await api
    .get('/api/studyrightkeywords')
    .query({ search: 'computer Science' })
    .set('x-access-token', token)
    .set('eduPersonPrincipalName', uid)
    .expect(200)
    .expect('Content-Type', /application\/json/)
  t.is(res.body.length, 40)
  t.truthy(res.body.every(r => r.toUpperCase().includes('COMPUTER SCIENCE')))
})

test('enrollment dates can be fetched', async t => {
  const res = await api
    .get('/api/enrollmentdates')
    .set('x-access-token', token)
    .set('eduPersonPrincipalName', uid)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  t.is(res.body.length, 722)
  t.truthy(res.body.includes('2014-09-02'))
})

test('tags can be searched by a searchterm', async t => {
  const res = await api
    .get('/api/tags')
    .query({ query: 'mooc' })
    .set('x-access-token', token)
    .set('eduPersonPrincipalName', uid)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  t.is(res.body.length, 2)
  t.deepEqual(res.body, ['mooc-2012', 'mooc-2013'])
})

test('populations can be searched by a searchterm', async t => {
  const res = await api
    .get('/api/departmentsuccess')
    .query({ date: '2005.08.01' })
    .set('x-access-token', token)
    .set('eduPersonPrincipalName', uid)
    .expect(200)
    .expect('Content-Type', /application\/json/)
  t.deepEqual(Object.keys(res.body).sort(), ['Chemistry', 'Computer Science', 'Mathematics', 'Physics'].sort())
  t.truthy(res.body['Computer Science'] > 20)
})

test.only('new api populations can be fetched', async t => {
  const res = await api
    .get('/api/populationstatistics')
    .query({
      year: '2010',
      semester: 'SPRING',
      studyRights: '16'
    })
    .set('x-access-token', token)
    .set('eduPersonPrincipalName', uid)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  const stats = res.body
  console.log(stats)
  t.is(stats.length, 6)

})

test('multiple population studyrights can be fetched', async t => {
  const res = await api
    .get('/api/populationstatistics')
    .query({
      year: '2010',
      semester: 'SPRING',
      studyRights: ['6', '7']
    })
    .set('x-access-token', token)
    .set('eduPersonPrincipalName', uid)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  const stats = res.body
  t.is(stats.length, 19)

})

test('population statics with wrong semester results in bad request', async t => {
  const res = await api
    .get('/api/populationstatistics')
    .query({
      year: '2010',
      semester: 'NO SEASON',
      studyRights: '500-K005'
    })
    .set('x-access-token', token)
    .set('eduPersonPrincipalName', uid)
    .expect(400)
    .expect('Content-Type', /application\/json/)

  const stats = res.body
  t.is(stats.error, 'Semester should be either SPRING OR FALL')

})

test('population statics with wrong semester results in bad request', async t => {
  const res = await api
    .get('/api/populationstatistics')
    .query({
      year: '2010',
      semester: 'SPRING',
      studyRights: '[Huolissaanolon maisteriohjelma, 500-K005]'
    })
    .set('x-access-token', token)
    .set('eduPersonPrincipalName', uid)
    .expect(400)
    .expect('Content-Type', /application\/json/)

  const stats = res.body
  t.is(stats.error, 'No such study rights: [Huolissaanolon maisteriohjelma, 500-K005]')

})

test('population statics without a proper queryresults in bad request', async t => {
  const res = await api
    .get('/api/populationstatistics')
    .query({ myName: 'Jeff' })
    .set('x-access-token', token)
    .set('eduPersonPrincipalName', uid)
    .expect(400)
    .expect('Content-Type', /application\/json/)

  const stats = res.body
  t.is(stats.error, 'The query should have a year, semester and study rights defined')

})
