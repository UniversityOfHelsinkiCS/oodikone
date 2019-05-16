const schema = 'student_schema'
process.env.DB_SCHEMA = schema

const test = require('ava')
const supertest = require('supertest')
const jwt = require('jsonwebtoken')

const { Course, CourseInstance, Credit, Student, sequelize } = require('../../src/models')
const { generateStudents, generateCredits, 
  generateCourses, generateCourseInstances,  } = require('../utils')

const app = require('../../src/app')
const conf = require('../../src/conf-backend')
const api = supertest(app)

const userId = 'tktl'
const payload = { userId, name: 'Koko nimi', enabled: true }

const token = jwt.sign(payload, conf.TOKEN_SECRET, {
  expiresIn: '24h'
})

let students
let courses
let courseInstances
let credits

test.skip.before(async () => {
  await sequelize.createSchema(schema)
  await sequelize.sync()
  courses = await generateCourses(3)
  courseInstances = await generateCourseInstances(courses, 1)
  students = await generateStudents(4)
  credits = await generateCredits(courseInstances, [students[0]], 1)
  await Course.bulkCreate(courses)
  await CourseInstance.bulkCreate(courseInstances)
  await Student.bulkCreate(students)
  await Credit.bulkCreate(credits)
})

test.skip.after.always(async () => {
  await sequelize.dropSchema(schema)
})

test.skip('a students information can be fetched', async t => {
  const res = await api
    .get(`/api/students/${students[0].studentnumber}`)
    .set('x-access-token', token)
    .set('uid', userId)
    .expect(200)
    .expect('Content-Type', /application\/json/)
  t.is(res.body.tags.length, 0)
  t.is(res.body.courses.length, 3)
})

test.skip('students are returned when searching', async t => {
  const res = await api
    .get('/api/students')
    .query({ searchTerm: '0' })
    .set('x-access-token', token)
    .set('uid', userId)
    .expect(200)
    .expect('Content-Type', /application\/json/)
  t.is(res.body.length, 4)
})