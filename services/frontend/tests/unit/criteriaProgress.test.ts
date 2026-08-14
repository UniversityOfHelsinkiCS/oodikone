import { getProgressCriteria } from '@/redux/populations/criteriaProgress'
import { CreditTypeCode, ProgressCriteria } from '@oodikone/shared/types'
import { StudentStudyPlan } from '@oodikone/shared/types/studentData'

import { PopulationCourseStatsCredit } from '@/redux/populations/util'
import { describe, it, assert } from 'vitest'

const createCriteria = (overrides: Partial<ProgressCriteria> = {}): ProgressCriteria => ({
  allCourseGroups: {
    CS001: [],
    CS002: [['CS002A', 'CS002B']],
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

const createHops = (includedCourses: string[]): StudentStudyPlan => ({
  included_courses: includedCourses,
  programme_code: 'TEST',
  includedModules: [],
  completed_credits: 0,
  curriculum_period_id: 'cp-1',
  sis_study_right_id: 'sr-1',
})

const createCredit = (
  course_code: string,
  credits: number,
  credittypecode: CreditTypeCode,
  date: Date
): PopulationCourseStatsCredit => ({
  grade: '',
  credits,
  credittypecode,
  attainment_date: date,
  isStudyModule: false,
  course_code,
  language: 'fi',
  studyright_id: 'sr-1',
})

const STUDY_RIGHT_START = new Date('2024-08-01')

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

    const result = getProgressCriteria(emptyCriteria, STUDY_RIGHT_START.toISOString(), undefined, [])

    assert.deepStrictEqual(result.year1, {
      credits: false,
      totalSatisfied: 0,
      coursesSatisfied: {},
    })
  })

  void it('records a passed main course as satisfied', () => {
    const result = getProgressCriteria(createCriteria(), STUDY_RIGHT_START.toISOString(), createHops(['CS001']), [
      createCredit('CS001', 5, CreditTypeCode.PASSED, new Date('2024-09-01')),
    ])

    assert.ok(result.year1.coursesSatisfied.CS001)
    assert.equal(result.year1.coursesSatisfied.CS002, null)
    assert.equal(result.year1.totalSatisfied, 1)
    assert.equal(result.year1.credits, false)
  })

  void it('marks a main course as substituted when its whole substitution group is passed', () => {
    const result = getProgressCriteria(
      createCriteria(),
      STUDY_RIGHT_START.toISOString(),
      createHops(['CS002A', 'CS002B']),
      [
        createCredit('CS002A', 3, CreditTypeCode.PASSED, new Date('2024-09-01')),
        createCredit('CS002B', 2, CreditTypeCode.PASSED, new Date('2024-09-02')),
      ]
    )

    assert.equal(result.year1.coursesSatisfied.CS002, 'substituted')
    assert.equal(result.year1.coursesSatisfied.CS001, null)
    assert.equal(result.year1.totalSatisfied, 1)
  })

  void it('counts credits only for courses included in the study plan', () => {
    // 5 credits from a HOPS course + 25 credits from a course outside the study plan
    const result = getProgressCriteria(createCriteria(), STUDY_RIGHT_START.toISOString(), createHops(['CS001']), [
      createCredit('CS001', 5, CreditTypeCode.PASSED, new Date('2024-09-01')),
      createCredit('CS003', 25, CreditTypeCode.PASSED, new Date('2024-09-02')),
    ])

    // 30 total credits but only 5 from the study plan, so the 30 credit criterion is not met
    assert.equal(result.year1.credits, false)
  })

  void it('excludes credits completed before the start of the first academic year', () => {
    const result = getProgressCriteria(
      createCriteria({ credits: { yearOne: 5, yearTwo: 60, yearThree: 0, yearFour: 0, yearFive: 0, yearSix: 0 } }),
      STUDY_RIGHT_START.toISOString(),
      createHops(['CS001']),
      [createCredit('CS001', 5, CreditTypeCode.PASSED, new Date('2024-05-01'))]
    )

    assert.equal(result.year1.credits, false)
  })

  void it('counts credits completed after the start of the first academic year', () => {
    const result = getProgressCriteria(
      createCriteria({ credits: { yearOne: 5, yearTwo: 60, yearThree: 0, yearFour: 0, yearFive: 0, yearSix: 0 } }),
      STUDY_RIGHT_START.toISOString(),
      createHops(['CS001']),
      [createCredit('CS001', 5, CreditTypeCode.PASSED, new Date('2024-09-01'))]
    )

    assert.equal(result.year1.credits, true)
  })

  void it('accumulates credits cumulatively across academic years', () => {
    const result = getProgressCriteria(
      createCriteria({ credits: { yearOne: 5, yearTwo: 10, yearThree: 60, yearFour: 0, yearFive: 0, yearSix: 0 } }),
      STUDY_RIGHT_START.toISOString(),
      createHops(['CS001', 'CS002']),
      [
        createCredit('CS001', 5, CreditTypeCode.PASSED, new Date('2024-09-01')),
        createCredit('CS002', 5, CreditTypeCode.PASSED, new Date('2025-09-01')),
      ]
    )

    assert.equal(result.year1.credits, true)
    assert.equal(result.year2.credits, true)
    assert.equal(result.year3.credits, false)
  })

  void it('ignores IMPROVED and FAILED credits', () => {
    const result = getProgressCriteria(
      createCriteria({ credits: { yearOne: 5, yearTwo: 60, yearThree: 0, yearFour: 0, yearFive: 0, yearSix: 0 } }),
      STUDY_RIGHT_START.toISOString(),
      createHops(['CS001']),
      [
        createCredit('CS001', 5, CreditTypeCode.IMPROVED, new Date('2024-09-01')),
        createCredit('CS001', 5, CreditTypeCode.FAILED, new Date('2024-09-02')),
      ]
    )

    assert.equal(result.year1.credits, false)
    assert.equal(result.year1.totalSatisfied, 0)
  })

  void it('satisfies the credit criterion when the target is met exactly', () => {
    const result = getProgressCriteria(createCriteria(), STUDY_RIGHT_START.toISOString(), createHops(['CS001']), [
      createCredit('CS001', 30, CreditTypeCode.PASSED, new Date('2024-09-01')),
    ])

    assert.equal(result.year1.credits, true)
    assert.equal(result.year1.totalSatisfied, 2)
  })
})
