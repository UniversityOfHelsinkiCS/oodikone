import { Express } from 'express'
import { describe, it, beforeAll, assert } from 'vitest'

import { initTests } from '../../../../utils'
import { getCourseYearlyStats, CourseYearlyStats } from '../helpers'

void describe('Course yearly attempt statistics - MAT11002 (no substitutions)', () => {
  let app: Express
  let body: CourseYearlyStats
  beforeAll(async () => {
    app = await initTests()
    body = await getCourseYearlyStats(app, 'codes=MAT11002&combineSubstitutions=false')
  })

  // FIXME: What is this even testing??
  it.skip('should not include attempts for student with only AY credit (501716)', () => {
    const stats = body.unifyStats?.statistics.find(year => year.name === '2017-2018')
    assert(stats && 'enrollments' in stats, 'Missing field enrollment in statsitics')
    assert.strictEqual(stats.attempts.categories.failed.length, 1)
    assert.deepStrictEqual(stats.attempts.categories.failed, ['501716'])
  })

  it('should include a failed and a passed attempt for a student with both (501716)', () => {
    const year = body.unifyStats?.statistics.find(year => year.name === '2018-2019')
    assert(year && 'enrollments' in year, 'Stats missing completely')
    assert.include(year.attempts.categories.failed, '501716', 'Failed attempts missing the student in question')
    assert.include(year.attempts.categories.passed, '501716', "Passed attempts didn't include the passed attempt")
    assert.include(year.attempts.grades['1'] ?? [], '501716', 'Grades should include the attempt in the correct grade')
  })

  it('should include an attempt with only approved grade (543385)', () => {
    const year = body.unifyStats?.statistics.find(year => year.name === '2022-2023')
    assert(year && 'enrollments' in year, 'Stats missing completely')
    assert.notInclude(year.attempts.categories.failed, '543385')
    assert.include(year.attempts.categories.passed, '543385', "Passed attempts didn't include the approved attempt")
    assert.include(year.attempts.grades['5'] ?? [], '543385', 'Grades should include the attempt in the correct grade')
  })

  it('should include an attempt with only improved grade (509770)', () => {
    const year = body.unifyStats?.statistics.find(year => year.name === '2018-2019')
    assert(year && 'enrollments' in year, 'Missing stats for 2018-2019')
    assert.include(year.attempts.categories.passed, '509770', 'Passed attempts should include in passed attempts')
  })
})
