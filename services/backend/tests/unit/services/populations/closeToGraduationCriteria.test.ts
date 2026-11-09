import { describe, it, assert } from 'vitest'
import { DegreeProgrammeType } from '@oodikone/shared/types'
import {
  getCloseToGraduationCreditThreshold,
  isCloseToGraduation,
} from '@/services/populations/closeToGraduationCriteria'
import { clockStorage } from '@/util/clock'

const NOW = new Date('2026-01-15')

const buildStudyRight = ({ cancelled = false, completedCredits = [140] }) => ({
  cancelled,
  studyPlans: completedCredits.map(completed_credits => ({ completed_credits })),
})

const buildElement = ({
  code = 'KH50_001',
  degreeProgrammeType = DegreeProgrammeType.BACHELOR,
  graduated = false,
  endDate = new Date('2027-07-31'),
}: {
  code?: string
  degreeProgrammeType?: DegreeProgrammeType
  graduated?: boolean
  endDate?: Date
}) => ({ code, degreeProgrammeType, graduated, endDate })

const checkAtNow = (...args: Parameters<typeof isCloseToGraduation>) =>
  clockStorage.run({ now: NOW }, () => isCloseToGraduation(...args))

void describe('getCloseToGraduationCreditThreshold', () => {
  it.each([
    ['KH50_001', DegreeProgrammeType.BACHELOR, 140],
    ['MH50_001', DegreeProgrammeType.MASTER, 70],
    ['MH30_001', DegreeProgrammeType.MASTER, 330],
    ['MH30_003', DegreeProgrammeType.MASTER, 300],
    ['MH30_004', DegreeProgrammeType.MASTER, 115],
    ['MH90_001', DegreeProgrammeType.LICENTIATE, 150],
    ['T920101', DegreeProgrammeType.DOCTOR, null],
    ['KH50_001', null, null],
  ])('should return the threshold for %s (%s)', (code, degreeProgrammeType, expected) => {
    assert.strictEqual(getCloseToGraduationCreditThreshold(code, degreeProgrammeType), expected)
  })
})

void describe('isCloseToGraduation', () => {
  it('should be true when study plan credits reach the threshold', () => {
    assert.isTrue(checkAtNow({ studyRight: buildStudyRight({}), studyRightElement: buildElement({}) }))
  })

  it('should be false when study plan credits are below the threshold', () => {
    assert.isFalse(
      checkAtNow({ studyRight: buildStudyRight({ completedCredits: [139] }), studyRightElement: buildElement({}) })
    )
  })

  it('should be true when any of the study plans reaches the threshold', () => {
    assert.isTrue(
      checkAtNow({ studyRight: buildStudyRight({ completedCredits: [10, 150] }), studyRightElement: buildElement({}) })
    )
  })

  it('should use the programme specific threshold', () => {
    const studyRightElement = buildElement({ code: 'MH30_001', degreeProgrammeType: DegreeProgrammeType.MASTER })
    assert.isFalse(checkAtNow({ studyRight: buildStudyRight({ completedCredits: [329] }), studyRightElement }))
    assert.isTrue(checkAtNow({ studyRight: buildStudyRight({ completedCredits: [330] }), studyRightElement }))
  })

  it('should be false without a study plan', () => {
    assert.isFalse(
      checkAtNow({ studyRight: buildStudyRight({ completedCredits: [] }), studyRightElement: buildElement({}) })
    )
  })

  it('should be false when the study right is cancelled', () => {
    assert.isFalse(
      checkAtNow({ studyRight: buildStudyRight({ cancelled: true }), studyRightElement: buildElement({}) })
    )
  })

  it('should be false when the student has graduated from the programme', () => {
    assert.isFalse(
      checkAtNow({ studyRight: buildStudyRight({}), studyRightElement: buildElement({ graduated: true }) })
    )
  })

  it('should be false when the study right element has ended', () => {
    assert.isFalse(
      checkAtNow({
        studyRight: buildStudyRight({}),
        studyRightElement: buildElement({ endDate: new Date('2026-01-14') }),
      })
    )
  })

  it('should be false for doctoral programmes', () => {
    assert.isFalse(
      checkAtNow({
        studyRight: buildStudyRight({ completedCredits: [500] }),
        studyRightElement: buildElement({ code: 'T920101', degreeProgrammeType: DegreeProgrammeType.DOCTOR }),
      })
    )
  })
})
