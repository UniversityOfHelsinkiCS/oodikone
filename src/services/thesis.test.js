const { forceSyncDatabase } = require('../database/connection')
const { Course, ElementDetails, ThesisTypeEnums, ThesisCourse } = require('../models')
const { createThesisCourse, deleteThesisCourse, findProgrammeTheses }  = require('./thesis')

const course = {
  code: 'COURSE',
  name: { en: 'Course_EN' }
}

const progOne = {
  code: 'CS_BSC',
  name: { en: 'CS_BSC' },
}

const progTwo = {
  code: 'CS_MSC',
  name: { en: 'CS_MSC' }
}

beforeEach(async() => {
  await forceSyncDatabase()
  await Course.create(course)
  await ElementDetails.create(progOne)
  await ElementDetails.create(progTwo)
})

test('createThesisCourse should save thesis correctly', async () => {
  await createThesisCourse(progOne.code, course.code, ThesisTypeEnums.MASTER)
  const courses = await ThesisCourse.findAll()
  expect(courses.length).toBe(1)
  expect(courses[0]).toMatchObject({ programmeCode: 'CS_BSC', courseCode: 'COURSE', thesisType: 'MASTER' })
})

test('createThesisCourse should create separate bachelor and thesis for same programme and course', async () => {
  await createThesisCourse(progOne.code, course.code, ThesisTypeEnums.MASTER)
  await createThesisCourse(progOne.code, course.code, ThesisTypeEnums.BACHELOR)
  const courses = await ThesisCourse.findAll()
  expect(courses.length).toBe(2)
  const master = courses.find(c => c.thesisType === 'MASTER')
  const bachelor = courses.find(c => c.thesisType === 'BACHELOR')
  expect(master).toBeTruthy()
  expect(master).toMatchObject({ programmeCode: 'CS_BSC', courseCode: 'COURSE', thesisType: 'MASTER' })
  expect(bachelor).toBeTruthy()
  expect(bachelor).toMatchObject({ programmeCode: 'CS_BSC', courseCode: 'COURSE', thesisType: 'BACHELOR' })
})

test('createThesisCourse should throw validation error for duplicate tuple (course, programme, type)', async () => {
  const createThesis = async () => createThesisCourse(progOne.code, course.code, ThesisTypeEnums.MASTER)
  await createThesis()
  await expect(createThesis()).rejects.toThrow('Validation error')
})

test('deleteThesisCourse removes thesis from table', async () => {
  let courses = await ThesisCourse.findAll()
  expect(courses.length).toBe(0)
  await createThesisCourse(progOne.code, course.code, ThesisTypeEnums.MASTER)
  await createThesisCourse(progOne.code, course.code, ThesisTypeEnums.BACHELOR)
  courses = await ThesisCourse.findAll()
  expect(courses.length).toBe(2)
  await deleteThesisCourse(progOne.code, course.code, ThesisTypeEnums.MASTER)
  courses = await ThesisCourse.findAll()
  expect(courses.length).toBe(1)
  expect(courses[0]).toMatchObject({ thesisType: 'BACHELOR' })
})

test('findProgrammeTheses returns correct courses', async () => {
  await createThesisCourse(progOne.code, course.code, ThesisTypeEnums.MASTER)
  await createThesisCourse(progOne.code, course.code, ThesisTypeEnums.BACHELOR)
  await createThesisCourse(progTwo.code, course.code, ThesisTypeEnums.MASTER)
  const theses = await findProgrammeTheses(progOne.code)
  expect(theses.length).toBe(2)
})

test('createThesisCourse should return created thesis', async () => {
  const thesis = await createThesisCourse(progOne.code, course.code, ThesisTypeEnums.MASTER)
  expect(thesis).toBeTruthy()
  expect(thesis).toMatchObject({ programmeCode: progOne.code, courseCode: course.code })
})
