import { Express } from 'express'
import { describe, it, beforeAll, assert } from 'vitest'

import { yearToYearCode } from '@oodikone/shared/util'
import { initTests } from '../../../../utils'
import { getCourseYearlyStats, CourseYearlyStats } from '../helpers'

const courseCodeToGroupId = {
  MAT21003: 'hy-CU-117375829',
}

void describe('Course yearly attempt statistics - MAT21003 (hy-CU-117375394, no substitutions)', () => {
  let app: Express
  beforeAll(async () => {
    app = await initTests()
  })

  describe('duplicate failed attempts across a large timespan are counted separately', () => {
    let body: CourseYearlyStats
    beforeAll(async () => {
      body = await getCourseYearlyStats(app, `courses=${courseCodeToGroupId.MAT21003}&substitutions=false`)
    })

    it('2017-2018 should include a single failed attempt (539036)', () => {
      const year = body.unifyStats?.statistics.find(year => year.name === '2017-2018')
      assert(year && 'enrollments' in year, 'Missing stats for 2017-2018')
      assert.deepStrictEqual(
        year.attempts.categories.failed,
        ['539036'],
        'Failed attempts should not include any students'
      )
    })

    it('2018-2019 should include a failed attempt (539036)', () => {
      const year = body.unifyStats?.statistics.find(year => year.name === '2018-2019')
      assert(year && 'enrollments' in year, 'Missing stats for 2018-2019')
      assert.include(year.attempts.categories.failed, '539036', 'Failed attempts should include the failed attempt')
    })
  })

  describe('year selection for smaller timeframes', () => {
    it.each([
      ['2017-2018', 2017, 2017],
      ['2020-2023', 2020, 2022],
      ['2016-2024', 2016, 2023],
    ])('should include correct years for %s', async (name, from, to) => {
      const body = await getCourseYearlyStats(
        app,
        `courses=hy-CU-117375394&substitutions=false&fromYearCode=${yearToYearCode(from)}&toYearCode=${yearToYearCode(to)}`
      )

      const years: string[] = []
      for (let i = from; i <= to; i++) {
        years.push(`${i}-${i + 1}`)
      }
      assert.deepStrictEqual(
        body.unifyStats.statistics.map(({ name }) => name),
        years,
        `${name} included incorrect years`
      )
    })
  })

  describe('duplicate attempts are counted again once an attempt falls out of the timespan', () => {
    it('2017-2018 should include a failed attempt (539036)', async () => {
      const body = await getCourseYearlyStats(
        app,
        `courses=${courseCodeToGroupId.MAT21003}&substitutions=false&fromYearCode=${yearToYearCode(2017)}&toYearCode=${yearToYearCode(2017)}`
      )
      const year = body.unifyStats.statistics.find(year => year.name === '2017-2018')
      assert(year && 'enrollments' in year, 'Missing stats for 2017-2018')
      assert.deepStrictEqual(
        year.attempts.categories.failed,
        ['539036'],
        'Failed attempts should have included a student'
      )
    })

    it('2018-2019 should include a failed attempt (539036)', async () => {
      const body = await getCourseYearlyStats(
        app,
        `courses=${courseCodeToGroupId.MAT21003}&substitutions=false&fromYearCode=${yearToYearCode(2018)}&toYearCode=${yearToYearCode(2018)}`
      )
      const year = body.unifyStats.statistics.find(year => year.name === '2018-2019')
      assert(year && 'enrollments' in year, 'Missing stats for 2018-2019')
      assert.include(year.attempts.categories.failed, '539036', 'Failed attempts included the incorrect students')
    })
  })
})
