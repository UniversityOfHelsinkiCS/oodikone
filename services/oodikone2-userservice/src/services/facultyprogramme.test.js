const { sequelize, forceSyncDatabase } = require('../database/connection')
const { FacultyProgrammes } = require('../models/index')
const facultyProgrammeService = require('./facultyprogrammes')

const facultyprogrammes = [
  {
    faculty_code: 'H10',
    programme_code: 'MH10_001',
  },
  {
    faculty_code: 'H50',
    programme_code: 'MH50_003',
  },
]

beforeAll(async () => {
  await forceSyncDatabase()
  FacultyProgrammes.bulkCreate(facultyprogrammes)
})
afterAll(async () => {
  await forceSyncDatabase()
  await sequelize.close()
})

describe('after running migrations the faculties faculty table', () => {
  test('includes some correct faculty & programme codes', async () => {
    const faculties = await facultyProgrammeService.findAll()
    expect(faculties.some(f => f.faculty_code === 'H10' && f.programme_code === 'MH10_001')).toBe(true)
    expect(faculties.some(f => f.faculty_code === 'H50' && f.programme_code === 'MH50_003')).toBe(true)
  })

  test('does not include incorrect faculty & programme codes', async () => {
    const faculties = await facultyProgrammeService.findAll()
    expect(faculties.some(f => f.faculty_code === 'KH4000')).toBe(false)
    expect(faculties.some(f => f.programme_code === 'SWAGLITTINEN')).toBe(false)
  })

})
