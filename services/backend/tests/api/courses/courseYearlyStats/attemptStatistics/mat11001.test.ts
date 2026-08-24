import { Express } from 'express'
import { describe, it, beforeAll, assert } from 'vitest'

import { initTests } from '../../../../utils'
import { getCourseYearlyStats, CourseYearlyStats } from '../helpers'

void describe('Course yearly attempt statistics - MAT11001 (no substitutions)', () => {
  let app: Express
  let body: CourseYearlyStats
  beforeAll(async () => {
    app = await initTests()
    body = await getCourseYearlyStats(app, 'codes=MAT11001&combineSubstitutions=false')
  })

  it('should include every attempt of a student who has only failed the course', () => {
    const stats = body.unifyStats?.statistics.find(year => year.name === '2018-2019')
    assert(stats && 'enrollments' in stats, 'Missing field enrollment in statsitics')

    assert.strictEqual(stats.attempts.categories.failed.length, 1, "Didn't include student's failed attempt")
    assert.deepStrictEqual(stats.attempts.categories.failed, ['542874'], "Didn't include student's failed attempt")
  })
})
