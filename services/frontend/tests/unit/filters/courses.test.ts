import { assert, describe, it } from 'vitest'

import { FilterType } from '@/components/FilterView/filters/courses/filterType'
import { CreditTypeCode } from '@oodikone/shared/types'

import { createCourse, createEnrollment, createStudent } from '@oodikone/shared/test/utils'

const { courseFilter } = await import('@/components/FilterView/filters/courses')

const TKT001_GROUP = 'group-tkt001'
const TKT002_ID = 'course-tkt002'
const TKT002_GROUP = 'group-tkt002'
const TKT003_ID = 'course-tkt003'
const TKT003_GROUP = 'group-tkt003'

const baseOptions = () => ({ courseFilters: {} })

const basePrecomputed = () => ({ courses: {}, substitutedBy: {} })

const baseArgs = () => ({ courses: [] })

const filterByType = (
  student: ReturnType<typeof createStudent>,
  filterType: (typeof FilterType)[keyof typeof FilterType],
  precomputed = basePrecomputed()
) =>
  courseFilter().filter(student, {
    args: baseArgs(),
    options: { courseFilters: { [TKT002_GROUP]: filterType } },
    precomputed,
  })

void describe('courseFilter', () => {
  void it('should keep every student when no course filters are selected', () => {
    const student = createStudent()

    const result = courseFilter().filter(student, {
      args: baseArgs(),
      options: baseOptions(),
      precomputed: basePrecomputed(),
    })

    assert.strictEqual(result, true)
  })

  void it('should include a student who passed the course when filtering for PASSED', () => {
    const student = createStudent({
      courses: [createCourse({ course_id: TKT002_ID, courseGroupId: TKT002_GROUP, passed: true })],
    })

    const result = courseFilter().filter(student, {
      args: baseArgs(),
      options: {
        ...baseOptions(),
        courseFilters: { [TKT002_GROUP]: FilterType.PASSED },
      },
      precomputed: basePrecomputed(),
    })

    assert.strictEqual(result, true)
  })

  void it('should exclude a student who has not attained the course when filtering for PASSED', () => {
    const student = createStudent({ courses: [] })

    const result = courseFilter().filter(student, {
      args: baseArgs(),
      options: { ...baseOptions(), courseFilters: { [TKT002_GROUP]: FilterType.PASSED } },
      precomputed: basePrecomputed(),
    })

    assert.strictEqual(result, false)
  })

  void it('should include a student who failed the course when filtering for FAILED', () => {
    const student = createStudent({
      courses: [
        createCourse({
          course_id: TKT002_ID,
          courseGroupId: TKT002_GROUP,
          passed: false,
          credittypecode: CreditTypeCode.FAILED,
        }),
      ],
    })

    const result = courseFilter().filter(student, {
      args: baseArgs(),
      options: {
        ...baseOptions(),
        courseFilters: { [TKT002_GROUP]: FilterType.FAILED },
      },
      precomputed: basePrecomputed(),
    })

    assert.strictEqual(result, true)
  })

  void it('should include a student who passed the course and failed another when filtering for PASSED', () => {
    const student = createStudent({
      courses: [
        createCourse({
          course_id: TKT002_ID,
          courseGroupId: TKT002_GROUP,
          passed: false,
          credittypecode: CreditTypeCode.FAILED,
        }),
        createCourse({
          course_id: TKT003_ID,
          courseGroupId: TKT003_GROUP,
          passed: true,
          credittypecode: CreditTypeCode.PASSED,
        }),
      ],
    })

    const result = courseFilter().filter(student, {
      args: baseArgs(),
      options: {
        ...baseOptions(),
        courseFilters: { [TKT003_GROUP]: FilterType.PASSED },
      },
      precomputed: basePrecomputed(),
    })

    assert.strictEqual(result, true)
  })

  void it('should include a student who failed the course and passed another when filtering for FAILED', () => {
    const student = createStudent({
      courses: [
        createCourse({
          course_id: TKT002_ID,
          courseGroupId: TKT002_GROUP,
          passed: false,
          credittypecode: CreditTypeCode.FAILED,
        }),
        createCourse({
          course_id: TKT003_ID,
          courseGroupId: TKT003_GROUP,
          passed: true,
          credittypecode: CreditTypeCode.PASSED,
        }),
      ],
    })

    const result = courseFilter().filter(student, {
      args: baseArgs(),
      options: {
        ...baseOptions(),
        courseFilters: { [TKT002_GROUP]: FilterType.FAILED },
      },
      precomputed: basePrecomputed(),
    })

    assert.strictEqual(result, true)
  })

  void it('should exclude a student who failed the course and later passed it when filtering for FAILED', () => {
    const student = createStudent({
      courses: [
        createCourse({ courseGroupId: TKT002_GROUP, passed: false, credittypecode: CreditTypeCode.FAILED }),
        createCourse({ courseGroupId: TKT002_GROUP, passed: true, credittypecode: CreditTypeCode.PASSED }),
      ],
    })

    assert.strictEqual(filterByType(student, FilterType.FAILED), false)
    assert.strictEqual(filterByType(student, FilterType.PASSED), true)
  })

  void it('should include enrolled and attained students but not others when filtering for ALL', () => {
    const enrolled = createStudent({ enrollments: [createEnrollment({ courseGroupId: TKT002_GROUP })] })
    const attained = createStudent({
      courses: [createCourse({ courseGroupId: TKT002_GROUP, credittypecode: CreditTypeCode.FAILED })],
    })
    const neither = createStudent({ enrollments: [createEnrollment({ courseGroupId: TKT003_GROUP })] })

    assert.strictEqual(filterByType(enrolled, FilterType.ALL), true)
    assert.strictEqual(filterByType(attained, FilterType.ALL), true)
    assert.strictEqual(filterByType(neither, FilterType.ALL), false)
  })

  void it('should include only enrolled students without an attainment when filtering for ENROLLED_NO_GRADE', () => {
    const enrolledOnly = createStudent({ enrollments: [createEnrollment({ courseGroupId: TKT002_GROUP })] })
    const enrolledAndAttained = createStudent({
      enrollments: [createEnrollment({ courseGroupId: TKT002_GROUP })],
      courses: [createCourse({ courseGroupId: TKT002_GROUP, credittypecode: CreditTypeCode.FAILED })],
    })

    assert.strictEqual(filterByType(enrolledOnly, FilterType.ENROLLED_NO_GRADE), true)
    assert.strictEqual(filterByType(enrolledAndAttained, FilterType.ENROLLED_NO_GRADE), false)
  })

  void it('should require every course of a substitution group to be passed', () => {
    const student = createStudent({
      courses: [createCourse({ courseGroupId: TKT001_GROUP, credittypecode: CreditTypeCode.PASSED })],
    })
    const precomputed = { courses: {}, substitutedBy: { [TKT002_GROUP]: [[TKT001_GROUP, TKT003_GROUP]] } }

    assert.strictEqual(filterByType(student, FilterType.PASSED, precomputed), false)
  })

  void it('should require every selected course filter to match', () => {
    const student = createStudent({
      courses: [
        createCourse({ course_id: TKT002_ID, courseGroupId: TKT002_GROUP, credittypecode: CreditTypeCode.PASSED }),
        createCourse({ course_id: TKT003_ID, courseGroupId: TKT003_GROUP, credittypecode: CreditTypeCode.PASSED }),
      ],
    })
    const filterWith = (courseFilters: Record<string, (typeof FilterType)[keyof typeof FilterType]>) =>
      courseFilter().filter(student, {
        args: baseArgs(),
        options: { ...baseOptions(), courseFilters },
        precomputed: basePrecomputed(),
      })

    assert.strictEqual(filterWith({ [TKT002_GROUP]: FilterType.PASSED, [TKT003_GROUP]: FilterType.PASSED }), true)
    assert.strictEqual(filterWith({ [TKT002_GROUP]: FilterType.PASSED, [TKT003_GROUP]: FilterType.FAILED }), false)
    assert.strictEqual(filterWith({ [TKT002_GROUP]: FilterType.PASSED, [TKT001_GROUP]: FilterType.ALL }), false)
  })

  void it('should precompute courses and substitutions from args', () => {
    const args = {
      courses: [
        {
          id: TKT002_ID,
          code: 'TKT002',
          groupId: TKT002_GROUP,
          name: { fi: 'Testi' },
          isStudyModule: false,
          isCustom: false,
          substitutionGroups: [[TKT001_GROUP, TKT003_GROUP]],
        },
      ],
    }

    const precomputed = courseFilter().precompute!({ students: [], args })

    assert.deepStrictEqual(Object.keys(precomputed.courses), [TKT002_GROUP])
    assert.deepStrictEqual(precomputed.substitutedBy, { [TKT002_GROUP]: [[TKT001_GROUP, TKT003_GROUP]] })
  })

  void it('should count substitutions only when includeSubstitutions is not disabled', () => {
    const student = createStudent({
      courses: [createCourse({ course_id: TKT003_ID, courseGroupId: TKT003_GROUP })],
    })
    const precomputed = { courses: {}, substitutedBy: { [TKT002_GROUP]: [[TKT003_GROUP]] } }
    const options = { courseFilters: { [TKT002_GROUP]: FilterType.PASSED } }

    const filterWith = (includeSubstitutions?: boolean) =>
      courseFilter().filter(student, { args: { courses: [], includeSubstitutions }, options, precomputed })

    assert.strictEqual(filterWith(), true)
    assert.strictEqual(filterWith(true), true)
    assert.strictEqual(filterWith(false), false)
  })

  void it('isActive should match filter state', () => {
    assert.strictEqual(
      courseFilter().isActive({ ...baseOptions(), courseFilters: { [TKT002_GROUP]: FilterType.ALL } }, undefined),
      true
    )
    assert.strictEqual(courseFilter().isActive(baseOptions(), undefined), false)
  })
})
