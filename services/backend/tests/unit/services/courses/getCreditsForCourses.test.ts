import { describe, it, assert, vi, afterEach } from 'vitest'
import { Op } from 'sequelize'

import { CreditTypeCode, Unification } from '@oodikone/shared/types'
import { StudentModel } from '../../../../src/models'
import { getCreditsForCourses } from '../../../../src/services/courses/creditsAndEnrollmentsOfCourse'

const credit = (overrides: Partial<Record<string, unknown>> = {}) => ({
  grade: '5',
  course_code: 'MAT11002',
  credits: 5,
  attainment_date: new Date(2020, 0, 1),
  student_studentnumber: '111',
  studyright_id: 'sr-1',
  credittypecode: CreditTypeCode.PASSED,
  ...overrides,
})

const mockStudents = (students: Array<{ studentnumber: string; credits: Array<Record<string, unknown>> }>) =>
  vi.spyOn(StudentModel, 'findAll').mockResolvedValue(students as any)

const from = new Date(2000, 0, 1)
const to = new Date(2030, 0, 1)

// Tests share a spy on the same StudentModel.findAll, so they must not run concurrently
// (the suite config default is sequence.concurrent: true).
void describe('Get credits for courses (unit, mocked db)', { concurrent: false }, () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should return no groups without any course codes, without querying credits by course', async () => {
    const findAll = mockStudents([{ studentnumber: '111', credits: [credit()] }])

    const res = await getCreditsForCourses([], Unification.UNIFY, from, to)

    assert.deepStrictEqual(res, [])
    assert.strictEqual(findAll.mock.calls.length, 1)
  })

  it('should query StudentModel with course codes, date range and openness filters', async () => {
    const findAll = mockStudents([])

    await getCreditsForCourses([['MAT11002'], ['MAT21001', 'MAT21002']], Unification.OPEN, from, to)

    const call = findAll.mock.calls[0][0] as any
    const creditInclude = call.include[0]

    assert.deepStrictEqual(creditInclude.where.course_code, { [Op.in]: ['MAT11002', 'MAT21001', 'MAT21002'] })
    assert.deepStrictEqual(creditInclude.where.attainment_date, { [Op.between]: [from, to] })
    assert.deepStrictEqual(creditInclude.where.is_open, { [Op.eq]: true })
  })

  it('should include both passed and failed credits for a single-code group as one group', async () => {
    mockStudents([
      {
        studentnumber: '111',
        credits: [credit({ credittypecode: CreditTypeCode.FAILED }), credit({ credittypecode: CreditTypeCode.PASSED })],
      },
    ])

    const res = await getCreditsForCourses([['MAT11002']], Unification.UNIFY, from, to)

    assert.strictEqual(res.length, 1)
    assert.strictEqual(res.flat().length, 2)
  })

  it('should create a separate group per student for a single-code group', async () => {
    mockStudents([
      { studentnumber: '111', credits: [credit({ student_studentnumber: '111' })] },
      { studentnumber: '222', credits: [credit({ student_studentnumber: '222' })] },
    ])

    const res = await getCreditsForCourses([['MAT11002']], Unification.UNIFY, from, to)

    assert.strictEqual(res.length, 2)
    assert.deepStrictEqual(res.map(group => group.map(c => c.student_studentnumber)).sort(), [['111'], ['222']])
  })

  it('should not create a group for a single course code the student has no credit for', async () => {
    mockStudents([{ studentnumber: '111', credits: [credit({ course_code: 'OTHER101' })] }])

    const res = await getCreditsForCourses([['MAT11002']], Unification.UNIFY, from, to)

    assert.deepStrictEqual(res, [])
  })

  it('should only include the passed credits of a substitution group when every code was passed', async () => {
    mockStudents([
      {
        studentnumber: '111',
        credits: [
          credit({ course_code: 'MAT11002', credittypecode: CreditTypeCode.PASSED }),
          credit({ course_code: 'MAT21001', credittypecode: CreditTypeCode.APPROVED }),
        ],
      },
    ])

    const res = await getCreditsForCourses([['MAT11002', 'MAT21001']], Unification.UNIFY, from, to)

    assert.strictEqual(res.length, 1)
    assert.deepStrictEqual(res[0].map(c => c.course_code).sort(), ['MAT11002', 'MAT21001'])
  })

  it('should exclude a partially completed substitution group entirely', async () => {
    mockStudents([
      {
        studentnumber: '111',
        credits: [
          credit({ course_code: 'MAT11002', credittypecode: CreditTypeCode.PASSED }),
          credit({ course_code: 'MAT21001', credittypecode: CreditTypeCode.FAILED }),
        ],
      },
    ])

    const res = await getCreditsForCourses([['MAT11002', 'MAT21001']], Unification.UNIFY, from, to)

    assert.deepStrictEqual(res, [])
  })

  it('should exclude an earlier failed attempt from a substitution group even when it later passed', async () => {
    mockStudents([
      {
        studentnumber: '111',
        credits: [
          credit({ course_code: 'MAT11002', credittypecode: CreditTypeCode.FAILED }),
          credit({ course_code: 'MAT11002', credittypecode: CreditTypeCode.PASSED }),
          credit({ course_code: 'MAT21001', credittypecode: CreditTypeCode.PASSED }),
        ],
      },
    ])

    const res = await getCreditsForCourses([['MAT11002', 'MAT21001']], Unification.UNIFY, from, to)

    assert.strictEqual(res.length, 1)
    assert.strictEqual(res.flat().length, 2)
    assert(
      res[0].every(c => c.credittypecode !== CreditTypeCode.FAILED),
      'failed attempt should not be included in the completed substitution group'
    )
  })

  it('should handle independent groups and students together', async () => {
    mockStudents([
      { studentnumber: '111', credits: [credit({ student_studentnumber: '111', course_code: 'MAT11002' })] },
      {
        studentnumber: '222',
        credits: [
          credit({ student_studentnumber: '222', course_code: 'MAT21001', credittypecode: CreditTypeCode.PASSED }),
          credit({ student_studentnumber: '222', course_code: 'MAT21002', credittypecode: CreditTypeCode.PASSED }),
        ],
      },
    ])

    const res = await getCreditsForCourses([['MAT11002'], ['MAT21001', 'MAT21002']], Unification.UNIFY, from, to)

    assert.strictEqual(res.length, 2)
  })
})
