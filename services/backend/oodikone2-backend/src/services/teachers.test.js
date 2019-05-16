const { Teacher } = require('../models/index')
const service = require('./teachers')

const teacher = {
  id: 'TID_001',
  code: 'usercode',
  name: 'Lastname Firstname Middlename'
}

beforeAll(async () => {
  await Teacher.create(teacher)
})

describe('teacher service tests', () => {

  describe('teacher by search term tests', () => {

    const teacherIsInResults = (id, matches) => matches.some(teacher => teacher.id === 'TID_001')

    test('Search by `usercode` finds teacher', async () => {
      const matches = await service.bySearchTerm('usercode')
      expect(teacherIsInResults('TID_001', matches)).toBe(true)
    })

    test('Search by `usercodeEXTRA` does not find teacher', async () => {
      const matches = await service.bySearchTerm('usercodeEXTRA')
      expect(teacherIsInResults(teacher.id, matches)).toBe(false)
    })

    test('Search by just `Lastname` should find the teacher', async () => {
      const matches = await service.bySearchTerm('Lastname')
      expect(teacherIsInResults(teacher.id, matches)).toBe(true)
    })

    test('Search by `Firstname` should find the teacher', async () => {
      const matches = await service.bySearchTerm('Firstname')
      expect(teacherIsInResults(teacher.id, matches)).toBe(true)
    })

    test('Search by `Lastname Firstname` should find the teacher', async () => {
      const matches = await service.bySearchTerm('Lastname Firstname')
      expect(teacherIsInResults(teacher.id, matches)).toBe(true)
    })

    test('Search by `Firstname Lastname` should find the teacher', async () => {
      const matches = await service.bySearchTerm('Firstname Lastname')
      expect(teacherIsInResults(teacher.id, matches)).toBe(true)
    })

    test('Search by `id` should find the teacher', async () => {
      const matches = await service.bySearchTerm('TID_001')
      expect(teacherIsInResults(teacher.id, matches)).toBe(true)
    })

  })

})