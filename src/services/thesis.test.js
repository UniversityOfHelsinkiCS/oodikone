const { forceSyncDatabase } = require('../database/connection')
const { Course, ElementDetails, ThesisTypeEnums, ThesisCourse } = require('../models')
const { createThesisCourse, deleteThesisCourse, findProgrammeTheses }  = require('./thesis')

const courseOne = {
  code: 'COURSE',
  name: { en: 'Course_EN' }
}

const courseTwo = {
  code: 'COURSE_2',
  name: { en: 'Course_EN_2' }
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
  await Course.create(courseOne)
  await Course.create(courseTwo)
  await ElementDetails.create(progOne)
  await ElementDetails.create(progTwo)
})

test('createThesisCourse should save thesis correctly', async () => {
  await createThesisCourse(progOne.code, courseOne.code, ThesisTypeEnums.MASTER)
  const courses = await ThesisCourse.findAll()
  expect(courses.length).toBe(1)
  expect(courses[0]).toMatchObject({ programmeCode: 'CS_BSC', courseCode: 'COURSE', thesisType: 'MASTER' })
})

test('createThesisCourse should create separate bachelor and thesis for same programme and course', async () => {
  await createThesisCourse(progOne.code, courseOne.code, ThesisTypeEnums.MASTER)
  await createThesisCourse(progOne.code, courseTwo.code, ThesisTypeEnums.BACHELOR)
  const courses = await ThesisCourse.findAll()
  expect(courses.length).toBe(2)
  const master = courses.find(c => c.thesisType === 'MASTER')
  const bachelor = courses.find(c => c.thesisType === 'BACHELOR')
  expect(master).toBeTruthy()
  expect(master).toMatchObject({ programmeCode: 'CS_BSC', courseCode: 'COURSE', thesisType: 'MASTER' })
  expect(bachelor).toBeTruthy()
  expect(bachelor).toMatchObject({ programmeCode: 'CS_BSC', courseCode: 'COURSE_2', thesisType: 'BACHELOR' })
})

test('createThesisCourse should error for creating a thesis for existing (course, prog) pair', async () => {
  await createThesisCourse(progOne.code, courseOne.code, ThesisTypeEnums.MASTER)
  const promise = createThesisCourse(progOne.code, courseOne.code, ThesisTypeEnums.BACHELOR)
  await expect(promise).rejects.toThrow('Validation error')
})

test('deleteThesisCourse removes thesis from table', async () => {
  let courses = await ThesisCourse.findAll()
  expect(courses.length).toBe(0)
  await createThesisCourse(progOne.code, courseOne.code, ThesisTypeEnums.MASTER)
  await createThesisCourse(progOne.code, courseTwo.code, ThesisTypeEnums.BACHELOR)
  courses = await ThesisCourse.findAll()
  expect(courses.length).toBe(2)
  await deleteThesisCourse(progOne.code, courseOne.code, ThesisTypeEnums.MASTER)
  courses = await ThesisCourse.findAll()
  expect(courses.length).toBe(1)
  expect(courses[0]).toMatchObject({ thesisType: 'BACHELOR' })
})

test('findProgrammeTheses returns correct courses', async () => {
  await createThesisCourse(progOne.code, courseOne.code, ThesisTypeEnums.MASTER)
  await createThesisCourse(progOne.code, courseTwo.code, ThesisTypeEnums.BACHELOR)
  await createThesisCourse(progTwo.code, courseOne.code, ThesisTypeEnums.MASTER)
  const theses = await findProgrammeTheses(progOne.code)
  expect(theses.length).toBe(2)
})

test('createThesisCourse should return created thesis', async () => {
  const thesis = await createThesisCourse(progOne.code, courseOne.code, ThesisTypeEnums.MASTER)
  expect(thesis).toBeTruthy()
  expect(thesis).toMatchObject({ programmeCode: progOne.code, courseCode: courseOne.code })
})
