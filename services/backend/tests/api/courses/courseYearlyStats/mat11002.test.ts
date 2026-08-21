import { Express } from 'express'
import { describe, it, beforeAll, assert } from 'vitest'

import { initTests } from '../../../utils'
import { calculatePassedAndFailed, getCourseYearlyStats, CourseYearlyStats } from './helpers'

void describe('Course yearly statistics - MAT11002 (no substitutions)', () => {
  let app: Express
  let body: CourseYearlyStats
  beforeAll(async () => {
    app = await initTests()
    body = await getCourseYearlyStats(app, 'codes=MAT11002&combineSubstitutions=false')
  })

  it('should not include students for AY code', () => {
    const stats = body.unifyStats?.statistics!.find(year => year.name === '2017-2018')
    assert(stats && 'enrollments' in stats, 'Missing field enrollment in statsitics')
    const studentCategories = calculatePassedAndFailed(stats.students.grades)
    assert(!studentCategories.failed.includes('534980'))
  })

  it('should not include student with failed grade after passed grade', () => {
    const year = body.unifyStats?.statistics.find(year => year.name === '2018-2019')
    assert(year && 'enrollments' in year, 'Stats missing completely')
    const studentCategories = calculatePassedAndFailed(year.students.grades)
    assert(!studentCategories.failed.includes('501716'), 'Failed students included incorrectly the student in question')
    assert(studentCategories.passed.includes('501716'), "Passed students didn't include student with a passed grade")
    assert(year.students.grades['1'].includes('501716'), 'Grades should include the student in the correct grade')
  })

  it('should include student with failed grade and passed AY grade', () => {
    const year = body.unifyStats?.statistics.find(year => year.name === '2020-2021')
    assert(year && 'enrollments' in year, 'Stats missing completely')
    const studentCategories = calculatePassedAndFailed(year.students.grades)
    assert(
      studentCategories.failed.includes('0011812135'),
      "Failed students didn't incorrectly include student in question"
    )
    assert(
      !studentCategories.passed.includes('0011812135'),
      'Passed students incorrectly included student without a passing grade'
    )
    assert(year.students.grades['0'].includes('0011812135'), 'Grades should include the student in the correct grade')
  })

  it('should include student with only approved grade', () => {
    const year = body.unifyStats?.statistics.find(year => year.name === '2022-2023')
    assert(year && 'enrollments' in year, 'Stats missing completely')
    const studentCategories = calculatePassedAndFailed(year.students.grades)
    assert(!studentCategories.failed.includes('543385'), 'Failed students included incorrectly the student in question')
    assert(studentCategories.passed.includes('543385'), "Passed students didn't include student with a passed grade")
    assert(year.students.grades['5'].includes('543385'), 'Grades should include the student in the correct grade')
  })

  it('should not count a student with only improved grades as passed (509770)', () => {
    const year = body.unifyStats?.statistics.find(year => year.name === '2018-2019')
    assert(year && 'enrollments' in year, 'Missing stats for 2018-2019')

    const studentCategories = calculatePassedAndFailed(year.students.grades)
    assert.notInclude(studentCategories.passed, '509770')
    assert.strictEqual(studentCategories.passed.length, 57)

    assert.notInclude(year.students.studentNumbers, '509770')
  })

  describe('enrollments', () => {
    it('2021-2022', () => {
      const year = body.unifyStats?.statistics.find(year => year.name === '2021-2022')
      assert(year && 'enrollments' in year, 'Missing field enrollment in statsitics')
      assert.strictEqual(year.enrollments.length, 27, 'Incorrect amount of distinct enrolled students 2021')
      assert.strictEqual(year.allEnrollments.length, 29, 'Incorrect amount of total enrolled students 2021')
    })

    it('2022-2023', () => {
      const year = body.unifyStats?.statistics.find(year => year.name === '2022-2023')
      assert(year && 'enrollments' in year, 'Missing field enrollment in statsitics')
      assert.strictEqual(year.enrollments.length, 23, 'Incorrect amount of distinct enrolled students 2022')
      assert.strictEqual(year.allEnrollments.length, 26, 'Incorrect amount of total enrolled students 2022')
    })

    it('2023-2024', () => {
      const year = body.unifyStats?.statistics.find(year => year.name === '2023-2024')
      assert(year && 'enrollments' in year, 'Missing field enrollment in statsitics')
      assert.strictEqual(year.enrollments.length, 1, 'Incorrect amount of distinct enrolled students 2023')
      assert.strictEqual(year.allEnrollments.length, 1, 'Incorrect amount of total enrolled students 2023')
    })

    it('total', () => {
      assert(
        body.unifyStats?.statistics.every(year => 'enrollments' in year),
        'Missing field enrollment in statsitics'
      )
      assert.strictEqual(
        body.unifyStats?.statistics.reduce((acc, yearStats) => acc + yearStats.enrollments.length, 0),
        27 + 23 + 1
      )
      assert.strictEqual(
        body.unifyStats?.statistics.reduce((acc, yearStats) => acc + yearStats.allEnrollments.length, 0),
        29 + 26 + 1
      )
      assert.strictEqual(
        body.unifyStats?.statistics.reduce(
          (acc, yearStats) => acc + calculatePassedAndFailed(yearStats.students.grades).failed.length,
          0
        ),
        1
      )
      assert.strictEqual(
        body.unifyStats?.statistics.reduce(
          (acc, yearStats) => acc + calculatePassedAndFailed(yearStats.students.grades).passed.length,
          0
        ),
        249
      )
    })
  })
})
