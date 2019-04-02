const { sequelize, Student, Studyright, StudyrightElement } = require('../../models')
const { readFileSync } = require('fs')
const path = require('path')
const { deleteStudentStudyrights } = require('./database_updater')

const SNUMBER = '012345678'

beforeAll(async () => {
  const filepath = path.resolve(__dirname, './database_updater.test.sql')
  const query = readFileSync(filepath, 'utf8')
  await sequelize.query(query)
})

const findStudent = snumber => Student.findByPk(snumber, {
  include: {
    model: Studyright,
    include: StudyrightElement
  }
})

test('deleteStudentStudyrights deletes associated studyrights and elements', async () => {
  const studentBefore = await findStudent(SNUMBER)
  expect(studentBefore).toBeTruthy()
  expect(studentBefore.studyrights.length).toBe(1)
  await deleteStudentStudyrights(SNUMBER)
  const studentAfter = await findStudent(SNUMBER)
  expect(studentAfter).toBeTruthy()
  expect(studentAfter.studyrights.length).toBe(0)
  const elements = await StudyrightElement.findAll({ where: { studentnumber: SNUMBER }})
  expect(elements.length).toBe(0)
})
