const schema = 'student_schema'
process.env.DB_SCHEMA = schema

const test = require('ava')
const supertest = require('supertest')
const jwt = require('jsonwebtoken')

const { Course, CourseInstance, Credit, Student, Tag, TagStudent, sequelize } = require('../../src/models')
const { generateTags, generateStudents, generateCredits,
  generateCourses, generateCourseInstances, generateTagStudents } = require('../utils')

const app = require('../../src/app')
const conf = require('../../src/conf-backend')
const api = supertest(app)

const uid = 'tktl', fullname = ''
const payload = { userId: uid, name: fullname }

const token = jwt.sign(payload, conf.TOKEN_SECRET, {
  expiresIn: '24h'
})

let students
let courses
let courseInstances
let credits
let tags
let tagStudents

test.before(async () => {
  await sequelize.createSchema(schema)
  await sequelize.sync()
  courses = await generateCourses(3)
  courseInstances = await generateCourseInstances(courses, 1)
  students = await generateStudents(4)
  credits = await generateCredits(courseInstances, [students[0]], 1)
  tags = await generateTags(6)
  tagStudents = await generateTagStudents(students, tags.slice(0, 5))
  await Course.bulkCreate(courses)
  await CourseInstance.bulkCreate(courseInstances)
  await Student.bulkCreate(students)
  await Tag.bulkCreate(tags)
  await TagStudent.bulkCreate(tagStudents)
  await Credit.bulkCreate(credits)
})

test.after.always(async () => {
  await sequelize.dropSchema(schema)
})

test('a students information can be fetched', async t => {
  const res = await api
    .get(`/api/students/${students[0].studentnumber}`)
    .set('x-access-token', token)
    .expect(200)
    .expect('Content-Type', /application\/json/)
  t.is(res.body.tags.length, 5)
  t.is(res.body.courses.length, 3)
})

test('students are returned when searching', async t => {
  const res = await api
    .get('/api/students')
    .query({ searchTerm: '0' })
    .set('x-access-token', token)
    .expect(200)
    .expect('Content-Type', /application\/json/)
  t.is(res.body.length, 4)
})

test('students tags can be added', async t => {
  let res = await api
    .get(`/api/students/${students[1].studentnumber}`)
    .set('x-access-token', token)
    .expect(200)
    .expect('Content-Type', /application\/json/)
  t.is(res.body.tags.length, 5)

  res = await api
    .post(`/api/students/${students[1].studentnumber}/tags`)
    .send({ studentnumber: students[1].studentnumber, tagname: tags[5].tagname })
    .set('x-access-token', token)
    .expect(201)
    .expect('Content-Type', /application\/json/)
  t.is(res.body.taggedstudents_studentnumber, students[1].studentnumber)
  t.is(res.body.tags_tagname, tags[5].tagname)

  res = await api
    .get(`/api/students/${students[1].studentnumber}`)
    .set('x-access-token', token)
    .expect(200)
    .expect('Content-Type', /application\/json/)
  t.is(res.body.tags.length, 6)

})

test('students tag can be removed', async t => {
  let res = await api
    .get(`/api/students/${students[2].studentnumber}`)
    .set('x-access-token', token)
    .expect(200)
    .expect('Content-Type', /application\/json/)
  t.is(res.body.tags.length, 5)

  res = await api
    .delete(`/api/students/${students[2].studentnumber}/tags`)
    .send({ studentnumber: students[2].studentnumber, tagname: tags[1].tagname })
    .set('x-access-token', token)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  res = await api
    .get(`/api/students/${students[2].studentnumber}`)
    .set('x-access-token', token)
    .expect(200)
    .expect('Content-Type', /application\/json/)
  t.is(res.body.tags.length, 4)
})

test('duplicate tags can\'t be added', async t => {
  let res = await api
    .get(`/api/students/${students[3].studentnumber}`)
    .set('x-access-token', token)
    .expect(200)
    .expect('Content-Type', /application\/json/)
  t.is(res.body.tags.length, 5)

  res = await api
    .post(`/api/students/${students[3].studentnumber}/tags`)
    .send({ studentnumber: students[3].studentnumber, tagname: tags[5].tagname })
    .set('x-access-token', token)
    .expect(201)
    .expect('Content-Type', /application\/json/)
  t.is(res.body.taggedstudents_studentnumber, students[3].studentnumber)
  t.is(res.body.tags_tagname, tags[5].tagname)
  
  res = await api
    .get(`/api/students/${students[3].studentnumber}`)
    .set('x-access-token', token)
    .expect(200)
    .expect('Content-Type', /application\/json/)
  t.is(res.body.tags.length, 6)

  res = await api
    .post(`/api/students/${students[3].studentnumber}/tags`)
    .send({ studentnumber: students[3].studentnumber, tagname: tags[5].tagname })
    .set('x-access-token', token)
    .expect(400)
    .expect('Content-Type', /application\/json/)

  res = await api
    .get(`/api/students/${students[3].studentnumber}`)
    .set('x-access-token', token)
    .expect(200)
    .expect('Content-Type', /application\/json/)
  t.is(res.body.tags.length, 6)
})

test('should pong when pinged', async t => {
  const res = await api
    .get('/ping')

  t.is(res.status, 200)
  t.deepEqual(res.body, { data: 'pong' })
})