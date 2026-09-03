import { describe, it, assert, beforeAll } from 'vitest'
import { initializeDatabaseConnection } from '@/database/connection'
import { findByCourseAndSemesters } from '@/services/students'
import { yearToYearCode } from '@oodikone/shared/util'
import { Unification } from '@oodikone/shared/types'
import { getRelevantCourseIdMap } from '@/services/courses'

const CSM14204 = 'hy-CU-119366777'
const MAT21018 = 'hy-CU-117377764'

void describe.concurrent('Search and complete substitution groups to codes', () => {
  beforeAll(async () => {
    await initializeDatabaseConnection()
  })

  type TestList = [string, number, number][]

  const semesterToSemesterCode = (semesterYear: number, springOrFall: 'spring' | 'fall') => {
    return (semesterYear - 1950) * 2 + (springOrFall === 'spring' ? 0 : 1)
  }

  void describe.concurrent('Find by course and semester', () => {
    it.each([
      ['semester', semesterToSemesterCode(2019, 'fall'), semesterToSemesterCode(2023, 'spring')],
      ['year', yearToYearCode(2017), yearToYearCode(2023)],
    ] as TestList)(
      'should return correct student numbers for a short course (CSM14204, 2019-2023) by $0',
      async (separate, to, from) => {
        const courseIds = await getRelevantCourseIdMap([CSM14204], false)
        const res = await findByCourseAndSemesters(
          Object.keys(courseIds),
          to,
          from,
          separate === 'semester',
          Unification.UNIFY
        )

        assert.deepStrictEqual([...res].sort(), ['458079', '478837', '483126'])
      }
    )

    it.each([
      ['semester', semesterToSemesterCode(2020, 'fall'), semesterToSemesterCode(2023, 'spring')],
      ['year', yearToYearCode(2020), yearToYearCode(2023)],
    ] as TestList)('should filter out students outside of 2020-2023 by $0', async (separate, to, from) => {
      const courseIds = await getRelevantCourseIdMap([CSM14204], false)
      const res = await findByCourseAndSemesters(
        Object.keys(courseIds),
        to,
        from,
        separate === 'semester',
        Unification.UNIFY
      )
      assert.deepStrictEqual([...res].sort(), ['478837', '483126'])
    })

    it.each([
      ['semester', semesterToSemesterCode(2017, 'fall'), semesterToSemesterCode(2021, 'spring')],
      ['year', yearToYearCode(2017), yearToYearCode(2020)],
    ] as TestList)(
      'should return correct student numbers for a longer course (MAT21018, 2017-2021) by $0',
      async (separate, to, from) => {
        const courseIds = await getRelevantCourseIdMap([MAT21018], false)
        const res = await findByCourseAndSemesters(
          Object.keys(courseIds),
          to,
          from,
          separate === 'semester',
          Unification.UNIFY
        )
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
        assert.deepStrictEqual([...res].sort(), passed.concat(failed).sort())
      }
    )

    it.each([
      ['semester', semesterToSemesterCode(2021, 'fall'), semesterToSemesterCode(2023, 'spring')],
      ['year', yearToYearCode(2021), yearToYearCode(2022)],
    ] as TestList)(
      'should return correct student numbers for a longer course (MAT21018, 2021-2023) by $0',
      async (separate, to, from) => {
        const courseIds = await getRelevantCourseIdMap([MAT21018], false)
        const res = await findByCourseAndSemesters(
          Object.keys(courseIds),
          to,
          from,
          separate === 'semester',
          Unification.UNIFY
        )
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

        assert.deepStrictEqual([...res].sort(), passed.concat(enrolledNoGrade).sort())
        assert.strictEqual(res.size, passed.length + enrolledNoGrade.length)
      }
    )

    it.todo('should return correct student numbers for multiple courses (CSM14204+MAT21018)')

    describe('should work with specific cases', () => {
      it('Student with enrollment in -21 and passed grade in -23 should be included in both stats when querying one year at a time (522321)', async () => {
        const courseIds = await getRelevantCourseIdMap([MAT21018], false)
        const res21 = await findByCourseAndSemesters(
          Object.keys(courseIds),
          yearToYearCode(2021),
          yearToYearCode(2021),
          false,
          Unification.UNIFY
        )
        const res23 = await findByCourseAndSemesters(
          Object.keys(courseIds),
          yearToYearCode(2022),
          yearToYearCode(2022),
          false,
          Unification.UNIFY
        )

        assert.include([...res21], '522321', '522321 incorrectly missing in -21 stats')
        assert.include([...res23], '522321', '522321 incorrectly missing in -23 stats')
      })
    })
  })
})
