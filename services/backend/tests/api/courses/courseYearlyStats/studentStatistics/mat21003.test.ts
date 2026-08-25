import { Express } from 'express'
import { describe, it, beforeAll, assert } from 'vitest'

import { yearToYearCode } from '@oodikone/shared/util'
import { initTests } from '../../../../utils'
import { calculatePassedAndFailed, getCourseYearlyStats, CourseYearlyStats } from '../helpers'

const courseCodeToGroupId = {
  MAT21003: 'hy-CU-117375829',
}

void describe('Course yearly statistics - MAT21003 (no substitutions)', () => {
  let app: Express
  beforeAll(async () => {
    app = await initTests()
  })

  describe('duplicate failed grades across a large timespan are not double-counted', () => {
    let body: CourseYearlyStats
    beforeAll(async () => {
      body = await getCourseYearlyStats(app, `courses=${courseCodeToGroupId.MAT21003}&substitutions=false`)
    })

    it('2017-2018 should not include a failed grade', () => {
      const year = body.unifyStats.statistics.find(year => year.name === '2017-2018')
      assert(year && 'enrollments' in year, 'Missing stats for 2017-2018')
      const studentCategories = calculatePassedAndFailed(year.students.grades)
      assert.strictEqual(studentCategories.failed.length, 0, 'Failed stats should not include any students')
      assert.deepStrictEqual(studentCategories.failed, [], 'Failed stats should not include any students')
    })

    it('2018-2019 should include a failed grade', () => {
      const year = body.unifyStats.statistics.find(year => year.name === '2018-2019')
      assert(year && 'enrollments' in year, 'Missing stats for 2018-2019')
      const studentCategories = calculatePassedAndFailed(year.students.grades)
      assert.strictEqual(studentCategories.failed.length, 1, 'Failed stats should include only one student')
      assert.deepStrictEqual(studentCategories.failed, ['539036'], 'Failed stats included the incorrect student')
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
        `courses=${courseCodeToGroupId.MAT21003}&substitutions=false&fromYearCode=${yearToYearCode(from)}&toYearCode=${yearToYearCode(to)}`
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

  describe('duplicate grades are counted again once an attainment falls out of the timespan', () => {
    it('2017-2018 should include a failed grade', async () => {
      const body = await getCourseYearlyStats(
        app,
        `courses=${courseCodeToGroupId.MAT21003}&substitutions=false&fromYearCode=${yearToYearCode(2017)}&toYearCode=${yearToYearCode(2017)}`
      )
      const year = body.unifyStats.statistics.find(year => year.name === '2017-2018')
      assert(year && 'enrollments' in year, 'Missing stats for 2017-2018')
      const studentCategories = calculatePassedAndFailed(year.students.grades)

      assert.deepStrictEqual(studentCategories.failed, ['539036'], 'Failed stats should have include a students')
      assert.strictEqual(studentCategories.failed.length, 1, 'Failed stats should have included a failed student')
    })

    it('2018-2019 should include a failed grade', async () => {
      const body = await getCourseYearlyStats(
        app,
        `courses=${courseCodeToGroupId.MAT21003}&substitutions=false&fromYearCode=${yearToYearCode(2018)}&toYearCode=${yearToYearCode(2018)}`
      )
      const year = body.unifyStats.statistics.find(year => year.name === '2018-2019')
      assert(year && 'enrollments' in year, 'Missing stats for 2018-2019')
      const studentCategories = calculatePassedAndFailed(year.students.grades)
      assert.deepStrictEqual(
        studentCategories.failed,
        ['539036', '540698', '542927', '544688'],
        'Failed stats included the incorrect students'
      )
      assert.strictEqual(studentCategories.failed.length, 4, 'Failed stats should include only one student')
    })
  })
})
