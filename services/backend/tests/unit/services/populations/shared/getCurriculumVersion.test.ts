import { getCurriculumVersion } from '@/services/populations/shared'
import { describe, it, assert } from 'vitest'

const curriculumPeriodsById = new Map(
  [74, 75, 76, 77, 78, 79, 80].map(version => {
    const startYear = version + 1949
    return [
      `hy-lv-${version}`,
      { startDate: new Date(`${startYear}-08-01`), endDate: new Date(`${startYear + 1}-07-31`) },
    ]
  })
)

void describe('getCurriculumVersion', () => {
  it('should return the range of a three year curriculum', () => {
    assert.strictEqual(getCurriculumVersion(['hy-lv-74', 'hy-lv-75', 'hy-lv-76'], curriculumPeriodsById), '2023-2026')
  })

  it('should return the range of a four year curriculum regardless of id order', () => {
    assert.strictEqual(
      getCurriculumVersion(['hy-lv-80', 'hy-lv-77', 'hy-lv-78', 'hy-lv-79'], curriculumPeriodsById),
      '2026-2030'
    )
  })

  it('should ignore unknown curriculum period ids', () => {
    assert.strictEqual(getCurriculumVersion(['hy-lv-77', 'hy-lv-999'], curriculumPeriodsById), '2026-2027')
  })

  it.each([[undefined], [[]], [['hy-lv-999']]])('should return null when no period is known (%j)', ids => {
    assert.isNull(getCurriculumVersion(ids, curriculumPeriodsById))
  })
})
