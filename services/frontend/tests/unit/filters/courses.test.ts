import { assert, describe, it } from 'vitest'

import { FilterType } from '@/components/FilterView/filters/courses/filterType'
import { CreditTypeCode } from '@oodikone/shared/types'

import { createCourse, createStudent } from '@oodikone/shared/test/utils'

const { courseFilter } = await import('@/components/FilterView/filters/courses')

const TKT001_GROUP = 'group-tkt001'
const TKT002_ID = 'course-tkt002'
const TKT002_GROUP = 'group-tkt002'
const TKT003_ID = 'course-tkt003'
const TKT003_GROUP = 'group-tkt003'

const baseOptions = () => ({
  courseFilters: {},
  courses: {},
  substitutedBy: {},
  includeSubstitutions: true,
  idToGroupIdMap: {},
})

const baseArgs = () => ({ courses: [], idToGroupIdMap: {} })

void describe('courseFilter', () => {
  void it('should keep every student when no course filters are selected', () => {
    const student = createStudent()

    const result = courseFilter().filter(student, {
      args: baseArgs(),
      options: baseOptions(),
      precomputed: undefined,
    })

    assert.strictEqual(result, true)
  })

  void it('should include a student who passed the course when filtering for PASSED', () => {
    const student = createStudent({ courses: [createCourse({ course_id: TKT002_ID, passed: true })] })

    const result = courseFilter().filter(student, {
      args: baseArgs(),
      options: {
        ...baseOptions(),
        courseFilters: { [TKT002_GROUP]: FilterType.PASSED },
        idToGroupIdMap: { [TKT002_ID]: TKT002_GROUP },
      },
      precomputed: undefined,
    })

    assert.strictEqual(result, true)
  })

  void it('should exclude a student who has not attained the course when filtering for PASSED', () => {
    const student = createStudent({ courses: [] })

    const result = courseFilter().filter(student, {
      args: baseArgs(),
      options: { ...baseOptions(), courseFilters: { [TKT002_GROUP]: FilterType.PASSED } },
      precomputed: undefined,
    })

    assert.strictEqual(result, false)
  })

  void it('should include a student who failed the course when filtering for FAILED', () => {
    const student = createStudent({
      courses: [createCourse({ course_id: TKT002_ID, passed: false, credittypecode: CreditTypeCode.FAILED })],
    })

    const result = courseFilter().filter(student, {
      args: baseArgs(),
      options: {
        ...baseOptions(),
        courseFilters: { [TKT002_GROUP]: FilterType.FAILED },
        idToGroupIdMap: { [TKT002_ID]: TKT002_GROUP },
      },
      precomputed: undefined,
    })

    assert.strictEqual(result, true)
  })

  void it('should include a student who failed and passed the course when filtering for PASSED', () => {
    const student = createStudent({
      courses: [
        createCourse({ course_id: TKT002_ID, passed: false, credittypecode: CreditTypeCode.FAILED }),
        createCourse({ course_id: TKT003_ID, passed: true, credittypecode: CreditTypeCode.PASSED }),
      ],
    })

    const result = courseFilter().filter(student, {
      args: baseArgs(),
      options: {
        ...baseOptions(),
        courseFilters: { [TKT003_GROUP]: FilterType.PASSED },
        idToGroupIdMap: { [TKT002_ID]: TKT002_GROUP, [TKT003_ID]: TKT003_GROUP },
      },
      precomputed: undefined,
    })

    assert.strictEqual(result, true)
  })

  void it('should exclude a student who failed and passed the course when filtering for FAILED', () => {
    const student = createStudent({
      courses: [
        createCourse({ course_id: TKT002_ID, passed: false, credittypecode: CreditTypeCode.FAILED }),
        createCourse({ course_id: TKT003_ID, passed: true, credittypecode: CreditTypeCode.PASSED }),
      ],
    })

    const result = courseFilter().filter(student, {
      args: baseArgs(),
      options: {
        ...baseOptions(),
        courseFilters: { [TKT002_GROUP]: FilterType.FAILED },
        idToGroupIdMap: { [TKT002_ID]: TKT002_GROUP, [TKT003_ID]: TKT003_GROUP },
      },
      precomputed: undefined,
    })

    assert.strictEqual(result, true)
  })

  void it('should populate options from args when precomputed', () => {
    const args = {
      courses: [
        {
          id: TKT002_ID,
          code: 'TKT002',
          groupId: TKT002_GROUP,
          name: { fi: 'Testi' },
          isStudyModule: false,
          substitutionGroups: [[TKT001_GROUP, TKT003_GROUP]],
        },
      ],
      includeSubstitutions: false,
      idToGroupIdMap: { [TKT002_ID]: TKT002_GROUP },
    }
    const options = baseOptions()

    // Modifies passed options
    courseFilter().precompute!({ students: [], options, args })

    assert.deepStrictEqual(Object.keys(options.courses), [TKT002_GROUP])
    assert.strictEqual(options.includeSubstitutions, false)
    assert.deepStrictEqual(options.substitutedBy, { [TKT002_GROUP]: [[TKT001_GROUP, TKT003_GROUP]] })
  })

  void it('isActive should match filter state', () => {
    assert.strictEqual(
      courseFilter().isActive({ ...baseOptions(), courseFilters: { [TKT002_GROUP]: FilterType.ALL } }, undefined),
      true
    )
    assert.strictEqual(courseFilter().isActive(baseOptions(), undefined), false)
  })
})
