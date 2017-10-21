const test = require('ava')
const supertest = require('supertest')
const app = require('../src/app')
const { sequelize } = require('../src/models')

const api = supertest(app)

const auth = {
  username: 'tktl',
  password: 'CsZerc8TUtR1S95CYOtTaC69'
}

test('should pong when pinged', async t => {
  const res = await api
    .get('/ping')
    .expect(200)
    .expect('Content-Type', /application\/json/)

  t.deepEqual(res.body, {data:"pong"} )
})


test('request without basic auth credentials fails', async t => {
  await api
    .get('/api/enrollmentdates')
    .expect(401)
    .expect('Content-Type', /application\/json/)
        
  t.pass()
})

test('request with basic nonexisting user fails', async t => {
  await api
    .get('/api/enrollmentdates')
    .auth('nonexistent', 'wrong')
    .expect(401)
    .expect('Content-Type', /application\/json/)
  
  t.pass()
})

test('request with wrong password fails', async t => {
  await api
    .get('/api/enrollmentdates')
    .auth('tktl', 'wrong')
    .expect(401)
    .expect('Content-Type', /application\/json/)

  t.pass()    
})  

test('request with correct credentials succeed', async t => {
  await api
    .get('/api/enrollmentdates')
    .auth(auth.username, auth.password)
    .expect(200)
    .expect('Content-Type', /application\/json/)
  
  t.pass()
})  

test('Studemts can be searched by searchterm', async t => {
  const res = await api
    .get('/api/students')
    .query({ searchTerm: 'Luukkainen Matti' })
    .auth(auth.username, auth.password)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  const students = res.body
  t.is(students.length, 1)
  t.is(students[0].studentNumber, '011120775')        
})