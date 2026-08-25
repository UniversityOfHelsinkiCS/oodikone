import { getProgressCriteria } from '@/redux/populations/criteriaProgress'
import { CreditTypeCode, ProgressCriteria } from '@oodikone/shared/types'

import { PopulationCourseStatsCredit } from '@/redux/populations/util'
import { createCredit as createBaseCredit, createStudyPlan } from '@oodikone/shared/test/utils'
import { describe, it, assert } from 'vitest'

// Course identities: course_id (what credits/enrollments/hops actually reference) -> groupId (stable
// across a course's historical ids/codes) -> code (display, used to key ProgressCriteria)
const COURSES = {
  CS001: { id: 'id-CS001', groupId: 'group-CS001', code: 'CS001' },
  CS002: { id: 'id-CS002', groupId: 'group-CS002', code: 'CS002' },
  CS002A: { id: 'id-CS002A', groupId: 'group-CS002A', code: 'CS002A' },
  CS002B: { id: 'id-CS002B', groupId: 'group-CS002B', code: 'CS002B' },
  CS003: { id: 'id-CS003', groupId: 'group-CS003', code: 'CS003' },
} as const

const idToCode = Object.fromEntries(Object.values(COURSES).map(({ id, code }) => [id, code]))
const groupIdToCode = Object.fromEntries(Object.values(COURSES).map(({ groupId, code }) => [groupId, code]))

const createCriteria = (overrides: Partial<ProgressCriteria> = {}): ProgressCriteria => ({
  allCourseGroups: {
    CS001: [],
    CS002: [[COURSES.CS002A.groupId, COURSES.CS002B.groupId]],
  },
  courses: {
    yearOne: ['CS001', 'CS002'],
    yearTwo: ['CS001', 'CS002'],
    yearThree: [],
    yearFour: [],
    yearFive: [],
    yearSix: [],
  },
  credits: {
    yearOne: 30,
    yearTwo: 60,
    yearThree: 0,
    yearFour: 0,
    yearFive: 0,
    yearSix: 0,
  },
  ...overrides,
})

const createHops = (includedCourseIds: string[]) => createStudyPlan({ included_courses: includedCourseIds })

const createCredit = (
  courseId: string,
  credits: number,
  credittypecode: CreditTypeCode,
  date: Date
): PopulationCourseStatsCredit =>
  createBaseCredit({ grade: '', credits, credittypecode, attainment_date: date, course_id: courseId })

const STUDY_RIGHT_START = new Date('2024-08-01')

const getProgress = (
  criteria: ProgressCriteria,
  hops: ReturnType<typeof createHops> | undefined,
  credits: PopulationCourseStatsCredit[]
) => getProgressCriteria(criteria, STUDY_RIGHT_START.toISOString(), hops, credits, idToCode, groupIdToCode)

void describe('getProgressCriteria', () => {
  void it('returns empty criteria when no criteria courses or credits are defined', () => {
    const emptyCriteria = createCriteria({
      allCourseGroups: {},
      courses: {
        yearOne: [],
        yearTwo: [],
        yearThree: [],
        yearFour: [],
        yearFive: [],
        yearSix: [],
      },
      credits: { yearOne: 0, yearTwo: 0, yearThree: 0, yearFour: 0, yearFive: 0, yearSix: 0 },
    })

    const result = getProgress(emptyCriteria, undefined, [])

    assert.deepStrictEqual(result.year1, {
      credits: false,
      totalSatisfied: 0,
      coursesSatisfied: {},
    })
  })

  void it('records a passed main course as satisfied', () => {
    const result = getProgress(createCriteria(), createHops([COURSES.CS001.id]), [
      createCredit(COURSES.CS001.id, 5, CreditTypeCode.PASSED, new Date('2024-09-01')),
    ])

    assert.ok(result.year1.coursesSatisfied.CS001)
    assert.equal(result.year1.coursesSatisfied.CS002, null)
    assert.equal(result.year1.totalSatisfied, 1)
    assert.equal(result.year1.credits, false)
  })

  void it('marks a main course as substituted when its whole substitution group is passed', () => {
    const result = getProgress(createCriteria(), createHops([COURSES.CS002A.id, COURSES.CS002B.id]), [
      createCredit(COURSES.CS002A.id, 3, CreditTypeCode.PASSED, new Date('2024-09-01')),
      createCredit(COURSES.CS002B.id, 2, CreditTypeCode.PASSED, new Date('2024-09-02')),
    ])

    assert.equal(result.year1.coursesSatisfied.CS002, 'substituted')
    assert.equal(result.year1.coursesSatisfied.CS001, null)
    assert.equal(result.year1.totalSatisfied, 1)
  })

  void it('counts credits only for courses included in the study plan', () => {
    // 5 credits from a HOPS course + 25 credits from a course outside the study plan
    const result = getProgress(createCriteria(), createHops([COURSES.CS001.id]), [
      createCredit(COURSES.CS001.id, 5, CreditTypeCode.PASSED, new Date('2024-09-01')),
      createCredit(COURSES.CS003.id, 25, CreditTypeCode.PASSED, new Date('2024-09-02')),
    ])

    // 30 total credits but only 5 from the study plan, so the 30 credit criterion is not met
    assert.equal(result.year1.credits, false)
  })

  void it('excludes credits completed before the start of the first academic year', () => {
    const result = getProgress(
      createCriteria({ credits: { yearOne: 5, yearTwo: 60, yearThree: 0, yearFour: 0, yearFive: 0, yearSix: 0 } }),
      createHops([COURSES.CS001.id]),
      [createCredit(COURSES.CS001.id, 5, CreditTypeCode.PASSED, new Date('2024-05-01'))]
    )

    assert.equal(result.year1.credits, false)
  })

  void it('counts credits completed after the start of the first academic year', () => {
    const result = getProgress(
      createCriteria({ credits: { yearOne: 5, yearTwo: 60, yearThree: 0, yearFour: 0, yearFive: 0, yearSix: 0 } }),
      createHops([COURSES.CS001.id]),
      [createCredit(COURSES.CS001.id, 5, CreditTypeCode.PASSED, new Date('2024-09-01'))]
    )

    assert.equal(result.year1.credits, true)
  })

  void it('accumulates credits cumulatively across academic years', () => {
    const result = getProgress(
      createCriteria({ credits: { yearOne: 5, yearTwo: 10, yearThree: 60, yearFour: 0, yearFive: 0, yearSix: 0 } }),
      createHops([COURSES.CS001.id, COURSES.CS002.id]),
      [
        createCredit(COURSES.CS001.id, 5, CreditTypeCode.PASSED, new Date('2024-09-01')),
        createCredit(COURSES.CS002.id, 5, CreditTypeCode.PASSED, new Date('2025-09-01')),
      ]
    )

    assert.equal(result.year1.credits, true)
    assert.equal(result.year2.credits, true)
    assert.equal(result.year3.credits, false)
  })

  void it('ignores IMPROVED and FAILED credits', () => {
    const result = getProgress(
      createCriteria({ credits: { yearOne: 5, yearTwo: 60, yearThree: 0, yearFour: 0, yearFive: 0, yearSix: 0 } }),
      createHops([COURSES.CS001.id]),
      [
        createCredit(COURSES.CS001.id, 5, CreditTypeCode.IMPROVED, new Date('2024-09-01')),
        createCredit(COURSES.CS001.id, 5, CreditTypeCode.FAILED, new Date('2024-09-02')),
      ]
    )

    assert.equal(result.year1.credits, false)
    assert.equal(result.year1.totalSatisfied, 0)
  })

  void it('satisfies the credit criterion when the target is met exactly', () => {
    const result = getProgress(createCriteria(), createHops([COURSES.CS001.id]), [
      createCredit(COURSES.CS001.id, 30, CreditTypeCode.PASSED, new Date('2024-09-01')),
    ])

    assert.equal(result.year1.credits, true)
    assert.equal(result.year1.totalSatisfied, 2)
  })
})
