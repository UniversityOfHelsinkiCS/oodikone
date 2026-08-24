import { Express } from 'express'
import { describe, it, beforeAll, assert } from 'vitest'

import { yearToYearCode } from '@oodikone/shared/util'
import { initTests } from '../../../../utils'
import { getCourseYearlyStats, CourseYearlyStats } from '../helpers'

void describe('Course yearly attempt statistics - TKT10002 (no substitutions)', () => {
  let app: Express
  beforeAll(async () => {
    app = await initTests()
  })

  describe('full range (2016-2023)', () => {
    let body: CourseYearlyStats
    beforeAll(async () => {
      body = await getCourseYearlyStats(
        app,
        `codes=TKT10002&combineSubstitutions=false&fromYearCode=${yearToYearCode(2016)}&toYearCode=${yearToYearCode(2023)}`
      )
    })

    it('has one entry per statistic year', () => {
      assert.strictEqual(body.unifyStats!.statistics.length, 8, 'unifyStats years')
      assert.strictEqual(body.regularStats!.statistics.length, 8, 'regularStats years')
      assert.strictEqual(body.openStats!.statistics.length, 4, 'openStats years')
    })

    it.each([
      ['2016-2017', { total: 1, passed: 1, failed: 0 }, { 5: 0, 4: 1, 3: 0, 2: 0, 1: 0, 0: 0, 'Hyl.': 0, 'Hyv.': 0 }],
      [
        '2017-2018',
        { total: 28, passed: 19, failed: 9 },
        { 5: 11, 4: 5, 3: 2, 2: 1, 1: 0, 0: 0, 'Hyl.': 9, 'Hyv.': 0 },
      ],
      [
        '2018-2019',
        { total: 32, passed: 26, failed: 6 },
        { 5: 18, 4: 3, 3: 2, 2: 1, 1: 2, 0: 5, 'Hyl.': 1, 'Hyv.': 0 },
      ],
      [
        '2019-2020',
        { total: 29, passed: 28, failed: 1 },
        { 5: 17, 4: 5, 3: 1, 2: 4, 1: 1, 0: 0, 'Hyl.': 1, 'Hyv.': 0 },
      ],
      [
        '2020-2021',
        { total: 23, passed: 23, failed: 0 },
        { 5: 18, 4: 2, 3: 0, 2: 2, 1: 0, 0: 0, 'Hyl.': 0, 'Hyv.': 1 },
      ],
      [
        '2021-2022',
        { total: 15, passed: 15, failed: 0 },
        { 5: 13, 4: 2, 3: 0, 2: 0, 1: 0, 0: 0, 'Hyl.': 0, 'Hyv.': 0 },
      ],
      [
        '2022-2023',
        { total: 27, passed: 27, failed: 0 },
        { 5: 21, 4: 6, 3: 0, 2: 0, 1: 0, 0: 0, 'Hyl.': 0, 'Hyv.': 0 },
      ],
      ['2023-2024', { total: 1, passed: 1, failed: 0 }, { 5: 1, 4: 0, 3: 0, 2: 0, 1: 0, 0: 0, 'Hyl.': 0, 'Hyv.': 0 }],
    ])('for attempt statistic content during (%s)', (year, categories, grades) => {
      const stats = body.unifyStats!.statistics.find(yearStats => yearStats.name === year)!
      assert('enrollments' in stats, 'Missing field enrollment in statsitics')

      assert.strictEqual(
        stats.attempts.categories.failed.length,
        categories.failed,
        `Incorrect amount of failed attempts for ${year}`
      )
      assert.strictEqual(
        stats.attempts.categories.passed.length,
        categories.passed,
        `Incorrect amount of passed attempts for ${year}`
      )
      assert.strictEqual(
        stats.attempts.categories.failed.length + stats.attempts.categories.passed.length,
        categories.total,
        `Incorrect amount of total attempts for ${year}`
      )

      Object.entries(grades).forEach(([grade, count]) =>
        assert.strictEqual(
          stats.attempts.grades[grade]?.length ?? 0,
          count,
          `Incorrect amount of attempts with grade ${grade}`
        )
      )
    })

    it('should include every attempt of a student who has failed a course in 2017 and later completed it', () => {
      const year2017 = body.unifyStats!.statistics.find(year => year.name === '2017-2018')
      const year2018 = body.unifyStats!.statistics.find(year => year.name === '2018-2019')
      const year2020 = body.unifyStats!.statistics.find(year => year.name === '2020-2021')
      const year2022 = body.unifyStats!.statistics.find(year => year.name === '2022-2023')
      assert(year2017 && 'enrollments' in year2017, 'Missing stats for 2017-2018')
      assert(year2018 && 'enrollments' in year2018, 'Missing stats for 2018-2019')
      assert(year2020 && 'enrollments' in year2020, 'Missing stats for 2020-2021')
      assert(year2022 && 'enrollments' in year2022, 'Missing stats for 2021-2022')

      assert.include(year2017.attempts.categories.failed, '457686')
      assert.include(year2018.attempts.categories.passed, '457686')

      assert.include(year2017.attempts.categories.failed, '455478')
      assert.include(year2020.attempts.categories.passed, '455478')
      assert.strictEqual(year2017.attempts.categories.failed.filter(sNum => sNum === '455478').length, 2) // Failed twice

      assert.include(year2017.attempts.categories.failed, '547994')
      assert.include(year2022.attempts.categories.passed, '547994')
    })
  })

  describe('single academic year ranges', () => {
    it.each([
      // Same as above
      ['2016-2017', { total: 1, passed: 1, failed: 0 }],
      ['2017-2018', { total: 28, passed: 19, failed: 9 }],
      ['2018-2019', { total: 32, passed: 26, failed: 6 }],
      ['2019-2020', { total: 29, passed: 28, failed: 1 }],
      ['2020-2021', { total: 23, passed: 23, failed: 0 }],
      ['2021-2022', { total: 15, passed: 15, failed: 0 }],
      ['2022-2023', { total: 27, passed: 27, failed: 0 }],
      ['2023-2024', { total: 1, passed: 1, failed: 0 }],
    ])('should include correct attempt stats for one academic year (%s)', async (year, categories) => {
      const body = await getCourseYearlyStats(
        app,
        `codes=TKT10002&combineSubstitutions=false&fromYearCode=${yearToYearCode(year.split('-').at(0))}&toYearCode=${yearToYearCode(parseInt(year.split('-').at(1)!)) - 1}`
      )
      const stats = body.unifyStats!.statistics.find(yearStats => yearStats.name === year)!
      assert('enrollments' in stats, 'Missing field enrollment in statsitics')

      assert.strictEqual(
        stats.attempts.categories.failed.length,
        categories.failed,
        `Incorrect amount of failed attempts for ${year}`
      )
      assert.strictEqual(
        stats.attempts.categories.passed.length,
        categories.passed,
        `Incorrect amount of passed attempts for ${year}`
      )
      assert.strictEqual(
        stats.attempts.categories.failed.length + stats.attempts.categories.passed.length,
        categories.total,
        `Incorrect amount of total attempts for ${year}`
      )
    })
  })
})
