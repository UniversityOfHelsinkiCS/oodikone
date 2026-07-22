import { describe, it, assert, beforeAll, vi } from 'vitest'
import { Unification } from '@oodikone/shared/types'
import { initializeDatabaseConnection } from '../../../src/database/connection'
import {
  maxYearsToCreatePopulationFrom,
  searchAndCombineSubstitutionGroupsToCodes,
} from '../../../src/services/courses'
import { findByCourseAndSemesters } from '../../../src/services/students'

void describe.concurrent('Search and complete substitution groups to codes', () => {
  beforeAll(async () => {
    await initializeDatabaseConnection()
  })

  it('should return correct course codes for MAT11001 (only single-length groups)', async () => {
    const res = await searchAndCombineSubstitutionGroupsToCodes(['MAT11001'])
    assert.deepStrictEqual(res, ['MAT11001', '57033', 'AYMAT11001', 'A57033'])
  })

  it('should return correct course codes for MAT21016 (also multicourse groups)', async () => {
    const res = await searchAndCombineSubstitutionGroupsToCodes(['MAT21016'])
    assert.deepStrictEqual(res, ['MAT21016', '57282', 'MFK-M310', 'MAT21023'])
  })
  it('should return correct course codes for MAT11001 + MAT21016', async () => {
    const res = await searchAndCombineSubstitutionGroupsToCodes(['MAT11001', 'MAT21016'])
    assert.deepStrictEqual(res, [
      'MAT11001',
      'MAT21016',
      '57033',
      'AYMAT11001',
      'A57033',
      '57282',
      'MFK-M310',
      'MAT21023',
    ])
  })
  it.todo('should return correct course codes for X + Y (duplicate courses in substitution groups)')
})

void describe.skip('Max years to generate population from', () => {
  beforeAll(async () => {
    await initializeDatabaseConnection()
  })

  it('should return no years without a course code', async () => {
    const res = await maxYearsToCreatePopulationFrom([], Unification.UNIFY)
    assert.strictEqual(res, 0, 'Got something else than 0 years')
  })

  it('should return correct years for MAT11001', async () => {
    const res = await maxYearsToCreatePopulationFrom(['MAT11001'], Unification.UNIFY)
    assert.strictEqual(res, 6)
  })

  it.todo('should should return the same max years as before', () => {
    const date = new Date(2020)
    vi.useFakeTimers()
    vi.setSystemTime(date)

    vi.useRealTimers()
  })
})

type TestList = [string, number, number][]

const semesterToSemesterCode = (semesterYear: number, springOrFall: 'spring' | 'fall') => {
  return (semesterYear - 1950) * 2 + (springOrFall === 'spring' ? 0 : 1)
}
const yearToYearCode = (year: number) => year - 1949

void describe.concurrent('Find by course and semester', () => {
  it.each([
    ['semester', semesterToSemesterCode(2019, 'fall'), semesterToSemesterCode(2023, 'spring')],
    ['year', yearToYearCode(2017), yearToYearCode(2023)],
  ] as TestList)(
    'should return correct student numbers for a short course (CSM14204, 2019-2023) by $0',
    async (separate, to, from) => {
      const res = (await findByCourseAndSemesters(['CSM14204'], to, from, separate === 'semester', 'unifyStats')).sort()
      assert.deepStrictEqual(res, ['458079', '478837', '483126'])
    }
  )

  it.each([
    ['semester', semesterToSemesterCode(2020, 'fall'), semesterToSemesterCode(2023, 'spring')],
    ['year', yearToYearCode(2020), yearToYearCode(2023)],
  ] as TestList)('should filter out students outside of 2020-2023 by $0', async (separate, to, from) => {
    const res = (await findByCourseAndSemesters(['CSM14204'], to, from, separate === 'semester', 'unifyStats')).sort()
    assert.deepStrictEqual(res, ['478837', '483126'])
  })

  it.each([
    ['semester', semesterToSemesterCode(2017, 'fall'), semesterToSemesterCode(2021, 'spring')],
    ['year', yearToYearCode(2017), yearToYearCode(2020)],
  ] as TestList)(
    'should return correct student numbers for a longer course (MAT21018, 2017-2021) by $0',
    async (separate, to, from) => {
      const res = (await findByCourseAndSemesters(['MAT21018'], to, from, separate === 'semester', 'unifyStats')).sort()
      const passed = ['457686', '495976', '484997', '491970', '461485', '501442', '508370']
      const failed = [
        '484541',
        '487566',
        '493344',
        '520906',
        '541350',
        '544750',
        '550840',
        '495398',
        '511089',
        '538399',
      ]
      assert.deepStrictEqual(res, passed.concat(failed).sort())
    }
  )

  it.each([
    ['semester', semesterToSemesterCode(2021, 'fall'), semesterToSemesterCode(2023, 'spring')],
    ['year', yearToYearCode(2021), yearToYearCode(2022)],
  ] as TestList)(
    'should return correct student numbers for a longer course (MAT21018, 2021-2023) by $0',
    async (separate, to, from) => {
      const res = (await findByCourseAndSemesters(['MAT21018'], to, from, separate === 'semester', 'unifyStats')).sort()
      const passed = [
        '509745',
        '504315',
        '520805',
        '509881',
        '511089',
        '519527',
        '522321',
        '527445',
        '538399',
        '534980',
        '474789',
        '478837',
        '482406',
        '486809',
        '547552',
        '493345',
        '495398',
        '498558',
      ]
      const enrolledNoGrade = ['529866', '488481', '479440', '518062']

      assert.deepStrictEqual(res, passed.concat(enrolledNoGrade).sort())
      assert.strictEqual(res.length, passed.length + enrolledNoGrade.length)
    }
  )

  it.todo('should return correct student numbers for multiple courses (CSM14204+MAT21018)')

  describe('should work with specific cases', () => {
    it('Student with enrollment in -21 and passed grade in -23 should be included in both stats when querying one year at a time (522321)', async () => {
      const res21 = (
        await findByCourseAndSemesters(['MAT21018'], yearToYearCode(2021), yearToYearCode(2021), false, 'unifyStats')
      ).sort()
      const res23 = (
        await findByCourseAndSemesters(['MAT21018'], yearToYearCode(2022), yearToYearCode(2022), false, 'unifyStats')
      ).sort()

      assert.include(res21, '522321', '522321 incorrectly missing in -21 stats')
      assert.include(res23, '522321', '522321 incorrectly missing in -23 stats')
    })
  })
})
