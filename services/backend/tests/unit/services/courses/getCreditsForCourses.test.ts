import { describe, it, assert, vi, afterEach } from 'vitest'
import { Op } from 'sequelize'

import { CreditTypeCode, Unification } from '@oodikone/shared/types'
import { Credit } from '@oodikone/shared/models'
import { createCredit as credit } from '@oodikone/shared/test/utils'
import { CreditModel } from '@/models'
import { getCreditsForCourses } from '@/services/courses/creditsAndEnrollmentsOfCourse'

const MAT11002 = 'hy-CU-117375394'
const MAT21001 = 'hy-CU-117375754'
const MAT21002 = 'hy-CU-117375793'
const OTHER101 = 'hy-CU-000000000'

const mockCredits = (credits: Array<Record<string, unknown>>) =>
  vi.spyOn(CreditModel, 'findAll').mockResolvedValue(credits as any)

const from = new Date(2000, 0, 1)
const to = new Date(2030, 0, 1)

// Tests share a spy on the same CreditModel.findAll, so they must not run concurrently
// (the suite config default is sequence.concurrent: true).
void describe('Get credits for courses (unit, mocked db)', { concurrent: false }, () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should return no groups when there are no groupId groups to match', async () => {
    const findAll = mockCredits([credit()])

    const res = await getCreditsForCourses([], [], Unification.UNIFY, from, to)

    assert.deepStrictEqual(res, [])
    assert.strictEqual(findAll.mock.calls.length, 1)
  })

  it('should query CreditModel with course ids, date range and openness filters', async () => {
    const findAll = mockCredits([])

    await getCreditsForCourses([[MAT11002], [MAT21001, MAT21002]], ['course-1', 'course-2'], Unification.OPEN, from, to)

    const call = findAll.mock.calls[0][0] as any

    assert.deepStrictEqual(call.where.course_id, { [Op.in]: ['course-1', 'course-2'] })
    assert.deepStrictEqual(call.where.attainment_date, { [Op.between]: [from, to] })
    assert.deepStrictEqual(call.where.is_open, { [Op.eq]: true })
  })

  it('should include both passed and failed credits for a single-code group as one group', async () => {
    mockCredits([credit({ credittypecode: CreditTypeCode.FAILED }), credit({ credittypecode: CreditTypeCode.PASSED })])

    const res = await getCreditsForCourses([[MAT11002]], ['course-1'], Unification.UNIFY, from, to)

    assert.strictEqual(res.length, 1)
    assert.strictEqual(res.flat().length, 2)
  })

  it('should create a separate group per student for a single-code group', async () => {
    mockCredits([credit({ student_studentnumber: '111' }), credit({ student_studentnumber: '222' })])

    const res = await getCreditsForCourses([[MAT11002]], ['course-1'], Unification.UNIFY, from, to)

    assert.strictEqual(res.length, 2)
    assert.deepStrictEqual(res.map(group => group.map(c => c.student_studentnumber)).sort(), [['111'], ['222']])
  })

  it('should not create a group for a single course code the student has no credit for', async () => {
    mockCredits([credit({ course_code: 'OTHER101', course: { groupId: OTHER101 } as Credit['course'] })])

    const res = await getCreditsForCourses([[MAT11002]], ['course-1'], Unification.UNIFY, from, to)

    assert.deepStrictEqual(res, [])
  })

  it('should only include the passed credits of a substitution group when every code was passed', async () => {
    mockCredits([
      credit({
        course_code: 'MAT11002',
        course: { groupId: MAT11002 } as Credit['course'],
        credittypecode: CreditTypeCode.PASSED,
      }),
      credit({
        course_code: 'MAT21001',
        course: { groupId: MAT21001 } as Credit['course'],
        credittypecode: CreditTypeCode.APPROVED,
      }),
    ])

    const res = await getCreditsForCourses(
      [[MAT11002, MAT21001]],
      ['course-1', 'course-2'],
      Unification.UNIFY,
      from,
      to
    )

    assert.strictEqual(res.length, 1)
    assert.deepStrictEqual(res[0].map(c => c.course_code).sort(), ['MAT11002', 'MAT21001'])
  })

  it('should exclude a partially completed substitution group entirely', async () => {
    mockCredits([
      credit({
        course_code: 'MAT11002',
        course: { groupId: MAT11002 } as Credit['course'],
        credittypecode: CreditTypeCode.PASSED,
      }),
      credit({
        course_code: 'MAT21001',
        course: { groupId: MAT21001 } as Credit['course'],
        credittypecode: CreditTypeCode.FAILED,
      }),
    ])

    const res = await getCreditsForCourses(
      [[MAT11002, MAT21001]],
      ['course-1', 'course-2'],
      Unification.UNIFY,
      from,
      to
    )

    assert.deepStrictEqual(res, [])
  })

  it('should exclude an earlier failed attempt from a substitution group even when it later passed', async () => {
    mockCredits([
      credit({
        course_code: 'MAT11002',
        course: { groupId: MAT11002 } as Credit['course'],
        credittypecode: CreditTypeCode.FAILED,
      }),
      credit({
        course_code: 'MAT11002',
        course: { groupId: MAT11002 } as Credit['course'],
        credittypecode: CreditTypeCode.PASSED,
      }),
      credit({
        course_code: 'MAT21001',
        course: { groupId: MAT21001 } as Credit['course'],
        credittypecode: CreditTypeCode.PASSED,
      }),
    ])

    const res = await getCreditsForCourses(
      [[MAT11002, MAT21001]],
      ['course-1', 'course-2'],
      Unification.UNIFY,
      from,
      to
    )

    assert.strictEqual(res.length, 1)
    assert.strictEqual(res.flat().length, 2)
    assert(
      res[0].every(c => c.credittypecode !== CreditTypeCode.FAILED),
      'failed attempt should not be included in the completed substitution group'
    )
  })

  it('should handle independent groups and students together', async () => {
    mockCredits([
      credit({
        student_studentnumber: '111',
        course_code: 'MAT11002',
        course: { groupId: MAT11002 } as Credit['course'],
      }),
      credit({
        student_studentnumber: '222',
        course_code: 'MAT21001',
        course: { groupId: MAT21001 } as Credit['course'],
        credittypecode: CreditTypeCode.PASSED,
      }),
      credit({
        student_studentnumber: '222',
        course_code: 'MAT21002',
        course: { groupId: MAT21002 } as Credit['course'],
        credittypecode: CreditTypeCode.PASSED,
      }),
    ])

    const res = await getCreditsForCourses(
      [[MAT11002], [MAT21001, MAT21002]],
      ['course-1', 'course-2', 'course-3'],
      Unification.UNIFY,
      from,
      to
    )

    assert.strictEqual(res.length, 2)
  })
})
