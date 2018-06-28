const schema = 'courses_schema'
process.env.DB_SCHEMA = schema

const test = require('ava')
const supertest = require('supertest')
const jwt = require('jsonwebtoken')

const { Course, CourseInstance, CourseTeacher, Credit, Teacher, Student, sequelize } = require('../../src/models')
const { generateCourses, generateCourseInstances, generateCredits, generateTeachers, generateStudents, generateCourseTeachers } = require('../utils')
const app = require('../../src/app')
const conf = require('../../src/conf-backend')
const api = supertest(app)

const uid = 'tktl', fullname = ''
const payload = { userId: uid, name: fullname, enabled: true }

const token = jwt.sign(payload, conf.TOKEN_SECRET, {
  expiresIn: '24h'
})

const INSTANCE_COUNT = 4

let courses
let courseInstances


test.skip.before(async () => {
  await sequelize.createSchema(schema)
  await sequelize.sync()
  courses = await generateCourses(1)
  courseInstances = await generateCourseInstances(courses, INSTANCE_COUNT)
  const students = await generateStudents()
  const credits = await generateCredits(courseInstances, students)
  const teachers = await generateTeachers()
  const courseTeachers = generateCourseTeachers(courseInstances, teachers)
  await Course.bulkCreate(courses)
  await CourseInstance.bulkCreate(courseInstances)
  await Student.bulkCreate(students)
  await Credit.bulkCreate(credits)
  await Teacher.bulkCreate(teachers)
  await CourseTeacher.bulkCreate(courseTeachers)
})

test.skip.after.always(async () => {
  await sequelize.dropSchema(schema)
})

test.skip('should pong when pinged', async t => {
  const res = await api
    .get('/ping')

  t.is(res.status, 200)
  t.deepEqual(res.body, { data: 'pong' })
})

test.skip('courses can be searched by a searchterm', async t => {
  const selectedCourse = courses[0]
  const res = await api
    .get('/api/courses')
    .query({ name: selectedCourse.name })
    .set('x-access-token', token)
    .set('uid', uid)
  t.is(res.status, 200)
  t.truthy(res.body.length > 0, 'res body was empty')
  const foundCourse = res.body.find(course => course.id === selectedCourse.id)
  t.is(selectedCourse.code, foundCourse.code)
  t.is(selectedCourse.name, foundCourse.name)
})