import { assert, describe, it } from 'vitest'

import { createStudent, createStudyRight, createStudyRightElement } from './helpers'

const { programmeFilter } = await import('@/components/FilterView/filters/programmes')

const ARGS = { additionalModes: [] }

void describe('programmeFilter', () => {
  void it('should precompute the programmes a student has had in "any" mode', () => {
    const student = createStudent({ studyRights: [createStudyRight()] })

    const precomputed = programmeFilter().precompute!({
      students: [student],
      options: { selectedProgrammes: [], mode: 'any' },
      args: ARGS,
    })

    assert.deepStrictEqual(
      precomputed[student.studentNumber].map(({ code }) => code),
      ['KH50_001']
    )
  })

  void it('should map students without any study rights to the "no programme" placeholder', () => {
    const student = createStudent({ studyRights: [] })

    const precomputed = programmeFilter().precompute!({
      students: [student],
      options: { selectedProgrammes: [], mode: 'any' },
      args: ARGS,
    })

    assert.deepStrictEqual(
      precomputed[student.studentNumber].map(({ code }) => code),
      ['00000']
    )
  })

  void it('should include student when the student has every selected programme', () => {
    const student = createStudent({ studyRights: [createStudyRight()] })

    const precomputed = { [student.studentNumber]: [{ code: 'KH50_001', name: { fi: 'Testiohjelma' } }] }

    const result = programmeFilter().filter(student, {
      args: ARGS,
      options: { selectedProgrammes: ['KH50_001'], mode: 'any' },
      precomputed,
    })

    assert.strictEqual(result, true)
  })

  void it('should exclude student when the student is missing a selected programme', () => {
    const student = createStudent({ studyRights: [createStudyRight()] })

    const precomputed = { [student.studentNumber]: [{ code: 'KH99_999', name: { fi: 'Testiohjelma' } }] }

    const result = programmeFilter().filter(student, {
      args: ARGS,
      options: { selectedProgrammes: ['KH50_001'], mode: 'any' },
      precomputed,
    })

    assert.strictEqual(result, false)
  })

  void it('should include student when the student has an currently active study right', () => {
    const thisYear = new Date().getFullYear()
    const student = createStudent({
      studyRights: [
        createStudyRight({
          startDate: new Date('2024-01-01'),
          studyRightElements: [
            createStudyRightElement({
              startDate: new Date(`${thisYear}-01-01`),
              endDate: new Date(`${thisYear + 1}-01-01`),
            }),
          ],
        }),
      ],
    })

    const precomputed = programmeFilter().precompute!({
      students: [student],
      options: { selectedProgrammes: ['KH50_001'], mode: 'active' },
      args: ARGS,
    })

    const result = programmeFilter().filter(student, {
      args: ARGS,
      options: { selectedProgrammes: ['KH50_001'], mode: 'active' },
      precomputed,
    })

    assert.strictEqual(result, true)
  })

  void it("should exclude student when the student doesnt' have a currently active study right", () => {
    const thisYear = new Date().getFullYear() - 3
    const student = createStudent({
      studyRights: [
        createStudyRight({
          startDate: new Date('2020-01-01'),
          studyRightElements: [
            createStudyRightElement({
              startDate: new Date(`${thisYear}-01-01`),
              endDate: new Date(`${thisYear + 1}-01-01`),
            }),
          ],
        }),
      ],
    })

    const precomputed = programmeFilter().precompute!({
      students: [student],
      options: { selectedProgrammes: ['KH50_001'], mode: 'active' },
      args: ARGS,
    })

    const result = programmeFilter().filter(student, {
      args: ARGS,
      options: { selectedProgrammes: ['KH50_001'], mode: 'active' },
      precomputed,
    })

    assert.strictEqual(result, false)
  })

  void it.todo('should include student when the student has an attainment during the timeframe (attainment)')
  void it.todo('should exclude student when the student does not have attainment during the timeframe (attainment)')

  void it.todo(
    'should include student when the student has had a study right since the start year associated with a study guidance group (assoc-year)'
  )
  void it.todo(
    'should exclude student when the student has not had a study right since the start year associated with a study guidance group (assoc-year)'
  )

  void it('isActive should match the filter state', () => {
    assert.strictEqual(programmeFilter().isActive({ selectedProgrammes: [], mode: 'any' }, ''), false)
    assert.strictEqual(programmeFilter().isActive({ selectedProgrammes: ['KH50_001'], mode: 'any' }, ''), true)

    assert.strictEqual(programmeFilter().isActive({ selectedProgrammes: [], mode: 'active' }, ''), false)
    assert.strictEqual(programmeFilter().isActive({ selectedProgrammes: ['KH50_001'], mode: 'active' }, ''), true)
  })
})
