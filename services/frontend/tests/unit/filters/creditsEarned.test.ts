import { assert, describe, it } from 'vitest'

import { creditsEarnedFilter } from '@/components/FilterView/filters/creditsEarned'
import { FormattedStudent } from '@oodikone/shared/types/studentData'

import { CreditTypeCode } from '@oodikone/shared/types'
import { createCourse, createStudent } from '@oodikone/shared/test/utils'

const filterStudent = (student: FormattedStudent, options: { min: number | null; max: number | null }) =>
  creditsEarnedFilter().filter(student, { args: undefined, options, precomputed: { min: undefined, max: undefined } })

void describe('creditsEarnedFilter', () => {
  void it('should pass a student whose credits fall within the given range', () => {
    const student = createStudent({ courses: [createCourse({ credits: 10 })] })

    assert.strictEqual(filterStudent(student, { min: 5, max: 20 }), true)
  })

  void it('should not pass a student whose credits are below the given minimum', () => {
    const student = createStudent({ courses: [createCourse({ credits: 3 })] })

    assert.strictEqual(filterStudent(student, { min: 5, max: null }), false)
  })

  void it('should not pass a student whose credits are above the given maximum', () => {
    const student = createStudent({ courses: [createCourse({ credits: 30 })] })

    assert.strictEqual(filterStudent(student, { min: null, max: 20 }), false)
  })

  void it('isActive should match the filter state', () => {
    assert.strictEqual(creditsEarnedFilter().isActive({ min: null, max: null }, undefined), false)
    assert.strictEqual(creditsEarnedFilter().isActive({ min: 5, max: null }, undefined), true)
    assert.strictEqual(creditsEarnedFilter().isActive({ min: null, max: 20 }, undefined), true)
    assert.strictEqual(creditsEarnedFilter().isActive({ min: 5, max: 20 }, undefined), true)
  })
})

void describe('creditsEarnedFilter credit counting', () => {
  void it('should include students exactly at the minimum and maximum', () => {
    const student = createStudent({ courses: [createCourse({ credits: 10 })] })

    assert.strictEqual(filterStudent(student, { min: 10, max: 10 }), true)
  })

  void it('should only count passed and approved credits, not failed ones or study modules', () => {
    const student = createStudent({
      courses: [
        createCourse({ credits: 5, credittypecode: CreditTypeCode.PASSED }),
        createCourse({ credits: 5, credittypecode: CreditTypeCode.APPROVED }),
        createCourse({ credits: 5, credittypecode: CreditTypeCode.FAILED }),
        createCourse({ credits: 30, isStudyModuleCredit: true }),
      ],
    })

    assert.strictEqual(filterStudent(student, { min: 10, max: 10 }), true)
  })

  void it('should precompute the credit bounds of the population', () => {
    const students = [
      createStudent({ courses: [createCourse({ credits: 5 })] }),
      createStudent({ courses: [createCourse({ credits: 20 }), createCourse({ credits: 15 })] }),
    ]

    assert.deepStrictEqual(creditsEarnedFilter().precompute!({ students, args: undefined }), { min: 5, max: 35 })
  })
})
