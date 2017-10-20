const assert = require('assert')
const api = require('supertest')
const chai = require('chai')
const expect = chai.expect

const app = require('../src/app')

describe('Oodikone Backend', function() {
  let request;
  const auth = {
    username: 'tktl',
    password: 'CsZerc8TUtR1S95CYOtTaC69'
  }

  beforeEach(()=>{
    request = api(app)  
  })

  it('should pong when pinged', (done) => {
    request = api(app)
      .get('/ping')
      .expect('Content-Type', /application\/json/)
      .expect(200)
      .then(response=>{
        expect(response.body).to.eql({data:"pong"})
        done()
      })
  })

  it('request without basic auth credentials fails', (done) => {
    request = api(app)
      .get('/api/enrollmentdates')
      .expect(401)
      .expect('Content-Type', /application\/json/)
      .end(done)
  })

  it('request with basic nonexisting user fails', (done) => {
    request = api(app)
      .get('/api/enrollmentdates')
      .auth('nonexistent', 'wrong')
      .expect(401)
      .expect('Content-Type', /application\/json/)
      .end(done)
  })

  it('request with wrong password fails', (done) => {
    request = api(app)
      .get('/api/enrollmentdates')
      .auth('tktl', 'wrong')
      .expect(401)
      .expect('Content-Type', /application\/json/)
      .end(done)
  })  

  it('request with correct credentials succeed', (done) => {
    request = api(app)
      .get('/api/enrollmentdates')
      .auth(auth.username, auth.password)
      .expect(200)
      .expect('Content-Type', /application\/json/)
      .end(done)
  })  

  after(()=>{
    app.getDb().close()
  })
})