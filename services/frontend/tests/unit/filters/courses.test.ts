import { assert, describe, it } from 'vitest'

import { FilterType } from '@/components/FilterView/filters/courses/filterType'
import { CreditTypeCode } from '@oodikone/shared/types'

import { createCourse, createStudent } from '@oodikone/shared/test/utils'

const { courseFilter } = await import('@/components/FilterView/filters/courses')

const baseOptions = () => ({
  courseFilters: {},
  courses: {},
  substitutedBy: {},
  includeSubstitutions: true,
})

void describe('courseFilter', () => {
  void it('should keep every student when no course filters are selected', () => {
    const student = createStudent()

    const result = courseFilter().filter(student, {
      args: { courses: [] },
      options: baseOptions(),
      precomputed: undefined,
    })

    assert.strictEqual(result, true)
  })

  void it('should include a student who passed the course when filtering for PASSED', () => {
    const student = createStudent({ courses: [createCourse({ course_code: 'TKT002', passed: true })] })

    const result = courseFilter().filter(student, {
      args: { courses: [] },
      options: { ...baseOptions(), courseFilters: { TKT002: FilterType.PASSED } },
      precomputed: undefined,
    })

    assert.strictEqual(result, true)
  })

  void it('should exclude a student who has not attained the course when filtering for PASSED', () => {
    const student = createStudent({ courses: [] })

    const result = courseFilter().filter(student, {
      args: { courses: [] },
      options: { ...baseOptions(), courseFilters: { TKT002: FilterType.PASSED } },
      precomputed: undefined,
    })

    assert.strictEqual(result, false)
  })

  void it('should include a student who failed the course when filtering for FAILED', () => {
    const student = createStudent({
      courses: [createCourse({ course_code: 'TKT002', passed: false, credittypecode: CreditTypeCode.FAILED })],
    })

    const result = courseFilter().filter(student, {
      args: { courses: [] },
      options: { ...baseOptions(), courseFilters: { TKT002: FilterType.FAILED } },
      precomputed: undefined,
    })

    assert.strictEqual(result, true)
  })

  void it('should include a student who failed and passed the course when filtering for PASSED', () => {
    const student = createStudent({
      courses: [
        createCourse({ course_code: 'TKT002', passed: false, credittypecode: CreditTypeCode.FAILED }),
        createCourse({ course_code: 'TKT003', passed: true, credittypecode: CreditTypeCode.PASSED }),
      ],
    })

    const result = courseFilter().filter(student, {
      args: { courses: [] },
      options: { ...baseOptions(), courseFilters: { TKT003: FilterType.PASSED } },
      precomputed: undefined,
    })

    assert.strictEqual(result, true)
  })

  void it('should exclude a student who failed and passed the course when filtering for FAILED', () => {
    const student = createStudent({
      courses: [
        createCourse({ course_code: 'TKT002', passed: false, credittypecode: CreditTypeCode.FAILED }),
        createCourse({ course_code: 'TKT003', passed: true, credittypecode: CreditTypeCode.PASSED }),
      ],
    })

    const result = courseFilter().filter(student, {
      args: { courses: [] },
      options: { ...baseOptions(), courseFilters: { TKT002: FilterType.FAILED } },
      precomputed: undefined,
    })

    assert.strictEqual(result, true)
  })

  void it('should populate options from args when precomputed', () => {
    const args = {
      courses: [
        {
          code: 'TKT002',
          name: { fi: 'Testi' },
          is_study_module: false,
          substitutions: [],
          substitution_groups: [['TKT001', 'TKT003']],
        },
      ],
      includeSubstitutions: false,
    }
    const options = baseOptions()

    // Modifies passed options
    courseFilter().precompute!({ students: [], options, args })

    assert.deepStrictEqual(Object.keys(options.courses), ['TKT002'])
    assert.strictEqual(options.includeSubstitutions, false)
    assert.deepStrictEqual(options.substitutedBy, { TKT002: [['TKT001', 'TKT003']] })
  })

  void it('isActive should match filter state', () => {
    assert.strictEqual(
      courseFilter().isActive({ ...baseOptions(), courseFilters: { TKT002: FilterType.ALL } }, undefined),
      true
    )
    assert.strictEqual(courseFilter().isActive(baseOptions(), undefined), false)
  })
})
