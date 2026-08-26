import { describe, it, assert } from 'vitest'

import { CreditTypeCode } from '@oodikone/shared/types'
import { Credit } from '@oodikone/shared/models'
import { createCredit as credit, createStudyRightElementModel } from '@oodikone/shared/test/utils'
import { parseCredit } from '@/services/courses'
import { SISStudyRightElementModel } from '@/models'

const studyRightElement = (...args: Parameters<typeof createStudyRightElementModel>) =>
  createStudyRightElementModel(...args) as SISStudyRightElementModel

void describe('parseCredit', () => {
  it('should parse a single passed credit', () => {
    const res = parseCredit([credit()], null, 'MAT11002', [studyRightElement()])

    assert.strictEqual(res.courseCode, 'MAT11002')
    assert.strictEqual(res.grade, '5')
    assert.strictEqual(res.credits, 5)
    assert.strictEqual(res.passed, true)
    assert.strictEqual(res.studentNumber, '111')
    assert.strictEqual(res.programme.code, 'KH50_005')
  })

  it('should mark a failed single credit as not passed', () => {
    const res = parseCredit([credit({ credittypecode: CreditTypeCode.FAILED })], null, 'MAT11002', [
      studyRightElement(),
    ])

    assert.strictEqual(res.passed, false)
  })

  it('should combine a substitution group into one credit with summed credits', () => {
    const res = parseCredit(
      [
        credit({ course_code: 'MAT11002', course: { groupId: 'hy-CU-117375394' } as Credit['course'], credits: 5 }),
        credit({ course_code: 'MAT21001', course: { groupId: 'hy-CU-117375754' } as Credit['course'], credits: 5 }),
      ],
      null,
      'MAT11002',
      [studyRightElement()]
    )

    assert.strictEqual(res.courseCode, 'MAT11002')
    assert.strictEqual(res.grade, 'substituted')
    assert.strictEqual(res.credits, 10)
    assert.strictEqual(res.passed, true)
  })

  it('should anonymize the student number when a salt is given', () => {
    const res = parseCredit([credit()], 'some-salt', 'MAT11002', [studyRightElement()])

    assert.notStrictEqual(res.studentNumber, '111')
    assert.match(res.studentNumber, /^[a-f0-9]{64}$/)
  })

  it('should fall back to programme OTHER when no matching study right element is found', () => {
    const res = parseCredit([credit()], null, 'MAT11002', [])

    assert.deepStrictEqual(res.programme.code, 'OTHER')
  })
})
