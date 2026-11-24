import { assert, describe, it } from 'vitest'

import { createStudent, createStudyRight, createStudyRightElement } from '@oodikone/shared/test/utils'

const { programmeFilter } = await import('@/components/FilterView/filters/programmes')

const ARGS = { additionalModes: [] }

void describe('programmeFilter', () => {
  void it('should precompute the programmes a student has had in "any" mode', () => {
    const student = createStudent({ studyRights: [createStudyRight()] })

    const precomputed = programmeFilter().precompute!({
      students: [student],
      args: ARGS,
    })('any')

    assert.deepStrictEqual(
      precomputed[student.studentNumber].map(({ code }) => code),
      ['KH50_001']
    )
  })

  void it('should map students without any study rights to the "no programme" placeholder', () => {
    const student = createStudent({ studyRights: [] })

    const precomputed = programmeFilter().precompute!({
      students: [student],
      args: ARGS,
    })('any')

    assert.deepStrictEqual(
      precomputed[student.studentNumber].map(({ code }) => code),
      ['00000']
    )
  })

  void it('should include student when the student has every selected programme', () => {
    const student = createStudent({ studyRights: [createStudyRight()] })

    const precomputed = () => ({ [student.studentNumber]: [{ code: 'KH50_001', name: { fi: 'Testiohjelma' } }] })

    const result = programmeFilter().filter(student, {
      args: ARGS,
      options: { selectedProgrammes: ['KH50_001'], mode: 'any' },
      precomputed,
    })

    assert.strictEqual(result, true)
  })

  void it('should exclude student when the student is missing a selected programme', () => {
    const student = createStudent({ studyRights: [createStudyRight()] })

    const precomputed = () => ({ [student.studentNumber]: [{ code: 'KH99_999', name: { fi: 'Testiohjelma' } }] })

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
      args: ARGS,
    })

    const result = programmeFilter().filter(student, {
      args: ARGS,
      options: { selectedProgrammes: ['KH50_001'], mode: 'active' },
      precomputed,
    })

    assert.strictEqual(result, false)
  })

  void it('should use the predicate of an additional mode given in args', () => {
    const student = createStudent({
      studyRights: [
        createStudyRight({
          studyRightElements: [
            createStudyRightElement({ code: 'KH50_001' }),
            createStudyRightElement({ code: 'MH50_001' }),
          ],
        }),
      ],
    })
    const args = {
      additionalModes: [
        {
          key: 'masters-only',
          label: 'Masters only',
          description: '',
          predicate: (_: unknown, { code }: { code: string }) => code.startsWith('MH'),
        },
      ],
    }

    const getStudentToProgrammeMap = programmeFilter(args).precompute!({ students: [student], args })
    const filterWith = (selectedProgrammes: string[]) =>
      programmeFilter(args).filter(student, {
        args,
        options: { selectedProgrammes, mode: 'masters-only' },
        precomputed: getStudentToProgrammeMap,
      })

    assert.deepStrictEqual(
      getStudentToProgrammeMap('masters-only')[student.studentNumber].map(({ code }) => code),
      ['MH50_001']
    )
    assert.strictEqual(filterWith(['MH50_001']), true)
    assert.strictEqual(filterWith(['KH50_001']), false)
  })

  void it('should not count cancelled study rights as active', () => {
    const thisYear = new Date().getFullYear()
    const student = createStudent({
      studyRights: [
        createStudyRight({
          cancelled: true,
          studyRightElements: [
            createStudyRightElement({
              startDate: new Date(`${thisYear - 1}-01-01`),
              endDate: new Date(`${thisYear + 1}-01-01`),
            }),
          ],
        }),
      ],
    })

    const getStudentToProgrammeMap = programmeFilter().precompute!({ students: [student], args: ARGS })

    assert.deepStrictEqual(
      getStudentToProgrammeMap('active')[student.studentNumber].map(({ code }) => code),
      ['00000']
    )
  })

  void it('should require the student to have every selected programme', () => {
    const student = createStudent()
    const precomputed = () => ({ [student.studentNumber]: [{ code: 'KH50_001', name: { fi: 'Testiohjelma' } }] })
    const filterWith = (selectedProgrammes: string[]) =>
      programmeFilter().filter(student, { args: ARGS, options: { selectedProgrammes, mode: 'any' }, precomputed })

    assert.strictEqual(filterWith(['KH50_001']), true)
    assert.strictEqual(filterWith(['KH50_001', 'MH50_001']), false)
  })

  void it.todo('should include student when the student has an attainment during the timeframe (attainment)')
  void it.todo('should exclude student when the student does not have attainment during the timeframe (attainment)')

  void it('isActive should match the filter state', () => {
    assert.strictEqual(programmeFilter().isActive({ selectedProgrammes: [], mode: 'any' }, ''), false)
    assert.strictEqual(programmeFilter().isActive({ selectedProgrammes: ['KH50_001'], mode: 'any' }, ''), true)

    assert.strictEqual(programmeFilter().isActive({ selectedProgrammes: [], mode: 'active' }, ''), false)
    assert.strictEqual(programmeFilter().isActive({ selectedProgrammes: ['KH50_001'], mode: 'active' }, ''), true)
  })
})
