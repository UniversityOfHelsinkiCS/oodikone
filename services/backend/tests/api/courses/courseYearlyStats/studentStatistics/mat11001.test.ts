import { Express } from 'express'
import { describe, it, beforeAll, assert } from 'vitest'

import { initTests } from '../../../../utils'
import { calculatePassedAndFailed, getCourseYearlyStats, CourseYearlyStats } from '../helpers'

void describe('Course yearly statistics - MAT11001 (hy-CU-117375151, no substitutions)', () => {
  let app: Express
  let body: CourseYearlyStats
  beforeAll(async () => {
    app = await initTests()
    body = await getCourseYearlyStats(app, 'courses=hy-CU-117375151&substitutions=false')
  })

  it('should include a student who has only failed the course', () => {
    const stats = body.unifyStats.statistics.find(year => year.name === '2018-2019')
    assert(stats && 'enrollments' in stats, 'Missing field enrollment in statsitics')

    const studentCategories = calculatePassedAndFailed(stats.students.grades)

    assert(
      studentCategories.failed.includes('542874'),
      "Stats didn't include student with only failed course attainment (failed)"
    )
    assert(
      !studentCategories.passed.includes('542874'),
      'Stats did incorrectly include student with only failed course attainment (passed)'
    )
    assert(
      !stats.enrollments.map(({ studentNumber }) => studentNumber).includes('542874'),
      "Stats didn't include student with only failed course attainment (enrollments)"
    )
  })
})
