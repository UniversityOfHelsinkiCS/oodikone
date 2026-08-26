import { Express } from 'express'
import { describe, it, beforeAll, assert } from 'vitest'

import { yearToYearCode } from '@oodikone/shared/util'
import { initTests } from '../../../../utils'
import { calculatePassedAndFailed, getCourseYearlyStats, CourseYearlyStats } from '../helpers'

const TKT10002 = 'hy-CU-118023867'

void describe('Course yearly statistics - TKT10002 (no substitutions)', () => {
  let app: Express
  beforeAll(async () => {
    app = await initTests()
  })

  describe('full range (2016-2023)', () => {
    let body: CourseYearlyStats
    beforeAll(async () => {
      body = await getCourseYearlyStats(
        app,
        `courses=${TKT10002}&substitutions=false&fromYearCode=${yearToYearCode(2016)}&toYearCode=${yearToYearCode(2023)}`
      )
    })

    it('has one entry per statistic year', () => {
      assert.strictEqual(body.unifyStats.statistics.length, 8, 'unifyStats years')
      assert.strictEqual(body.regularStats.statistics.length, 8, 'regularStats years')
      assert.strictEqual(body.openStats.statistics.length, 4, 'openStats years')

      // Faculties should have the same amount of years as normal statistics (above)
      assert.strictEqual(Object.keys(body.unifyStats.facultyStats).length, 8, 'unifyStats years')
      assert.strictEqual(Object.keys(body.regularStats.facultyStats).length, 8, 'regularStats years')
      assert.strictEqual(Object.keys(body.openStats.facultyStats).length, 4, 'openStats years')
    })

    // TODO: Rewrite /courseyearlystats so that total = passed + failed + enrolledNoGrade
    it.each([
      [
        '2016-2017',
        { total: 1, passed: 1, failed: 0, enrolledNoGrade: 0 },
        { 5: 0, 4: 1, 3: 0, 2: 0, 1: 0, 0: 0, 'Hyv.': 0 },
      ],
      [
        '2017-2018',
        { total: 23, passed: 19, failed: 4, enrolledNoGrade: 0 },
        // NOTE: If looking at credits, all Hyl. will be added as grade '0'
        // eg. here 0 students got grade 0 and 4 students got grade Hyl.
        { 5: 11, 4: 5, 3: 2, 2: 1, 1: 0, 0: 4, 'Hyv.': 0 },
      ],
      [
        '2018-2019',
        { total: 28, passed: 26, failed: 2, enrolledNoGrade: 0 },
        { 5: 18, 4: 3, 3: 2, 2: 1, 1: 2, 0: 2, 'Hyv.': 0 },
      ],
      [
        '2019-2020',
        { total: 28, passed: 28, failed: 0, enrolledNoGrade: 0 },
        { 5: 17, 4: 5, 3: 1, 2: 4, 1: 1, 0: 0, 'Hyv.': 0 },
      ],
      [
        '2020-2021',
        { total: 23, passed: 23, failed: 0, enrolledNoGrade: 0 },
        { 5: 18, 4: 2, 3: 0, 2: 2, 1: 0, 0: 0, 'Hyv.': 1 },
      ],
      [
        '2021-2022',
        { total: 15, passed: 15, failed: 0, enrolledNoGrade: 20 },
        { 5: 13, 4: 2, 3: 0, 2: 0, 1: 0, 0: 0, 'Hyv.': 0 },
      ],
      [
        '2022-2023',
        { total: 27, passed: 27, failed: 0, enrolledNoGrade: 34 },
        { 5: 21, 4: 6, 3: 0, 2: 0, 1: 0, 0: 0, 'Hyv.': 0 },
      ],
      [
        '2023-2024',
        { total: 1, passed: 1, failed: 0, enrolledNoGrade: 7 },
        { 5: 1, 4: 0, 3: 0, 2: 0, 1: 0, 0: 0, 'Hyv.': 0 },
      ],
    ])('for statistic content during ($0)', (year, categories, grades) => {
      const stats = body.unifyStats.statistics.find(yearStats => yearStats.name === year)!
      assert('enrollments' in stats, 'Missing field enrollment in statsitics')

      const studentCategories = calculatePassedAndFailed(stats.students.grades)

      if (categories) {
        assert.strictEqual(
          studentCategories.failed.length,
          categories.failed,
          `Incorrect amount of failed students for ${year}`
        )
        assert.strictEqual(
          studentCategories.passed.length,
          categories.passed,
          `Incorrect amount of passed students for ${year}`
        )
        assert.strictEqual(
          stats.students.studentNumbers.length,
          categories.total,
          `Incorrect amount of total students for ${year}`
        )
        assert.strictEqual(
          stats.enrollments.length,
          categories.enrolledNoGrade,
          `Incorrect amount of enrolled students for ${year}`
        )
      }
      if (grades) {
        Object.entries(grades).forEach(([grade, count]) =>
          assert.strictEqual(
            stats.students.grades[grade]?.length ?? 0,
            count,
            `Incorrect amount of students with grade ${grade}`
          )
        )
      }
    })

    it('should include students who have failed a course and then completed it only once', () => {
      const stats2017 = body.unifyStats.statistics.find(year => year.name === '2017-2018')!
      const { studentNumbers } = stats2017.students
      assert.notIncludeMembers(
        studentNumbers,
        ['457686' /* SPRING 2019*/, '455478' /* FALL 2020 */, '547994' /* FALL 2022*/],
        "Students that have completed course later should not be included in the previous year's stats"
      )

      const year2017 = body.unifyStats.statistics.find(year => year.name === '2017-2018')
      const year2018 = body.unifyStats.statistics.find(year => year.name === '2018-2019')
      const year2020 = body.unifyStats.statistics.find(year => year.name === '2020-2021')
      const year2022 = body.unifyStats.statistics.find(year => year.name === '2022-2023')
      assert(year2017 && 'enrollments' in year2017, 'Missing stats for 2017-2018')
      assert(year2018 && 'enrollments' in year2018, 'Missing stats for 2018-2019')
      assert(year2020 && 'enrollments' in year2020, 'Missing stats for 2020-2021')
      assert(year2022 && 'enrollments' in year2022, 'Missing stats for 2022-2023')

      const studentCategories2017 = calculatePassedAndFailed(year2017.students.grades)
      const studentCategories2018 = calculatePassedAndFailed(year2018.students.grades)
      const studentCategories2020 = calculatePassedAndFailed(year2020.students.grades)
      const studentCategories2022 = calculatePassedAndFailed(year2022.students.grades)

      assert(
        !studentCategories2017.passed.includes('457686') && !studentCategories2017.failed.includes('457686'),
        "Student was incorrectly included to the failed course code's year stats (457686)"
      )
      assert(
        studentCategories2018.passed.includes('457686') && year2018.students.grades['5'].includes('457686'),
        "Student was incorrectly excluded from the passed course's completion year stats (457686)"
      )

      assert(
        !studentCategories2017.passed.includes('455478') && !studentCategories2017.failed.includes('455478'),
        "Student was incorrectly included to the failed course code's year stats (455478)"
      )
      assert(
        studentCategories2020.passed.includes('455478') && year2020.students.grades['2'].includes('455478'),
        "Student was incorrectly excluded from the passed course's completion year stats (455478)"
      )

      assert(
        !studentCategories2017.passed.includes('547994') && !studentCategories2017.failed.includes('547994'),
        "Student was incorrectly included to the failed course code's year stats (547994)"
      )
      assert(
        studentCategories2022.passed.includes('547994') && year2022.students.grades['5'].includes('547994'),
        "Student was incorrectly excluded from the passed course's completion year stats (547994)"
      )
    })

    it("should mark student's enrollment time correctly with mismatched semestercode and enrollment_date_time", () => {
      const stats2021 = body.unifyStats.statistics.find(year => year.name === '2021-2022')!
      const stats2022 = body.unifyStats.statistics.find(year => year.name === '2022-2023')!
      assert('enrollments' in stats2021, 'Missing field enrollment in statsitics (2021)')
      assert('enrollments' in stats2022, 'Missing field enrollment in statsitics (2022)')
      // Student with enrollment_date_time outside of semestert start and end dates
      assert(
        !stats2021.enrollments.map(enrollment => enrollment.studentNumber).includes('455129') &&
          stats2022.enrollments.map(enrollment => enrollment.studentNumber).includes('455129'),
        'Student with incorrect semester (by updater) but a correct enrollment_date was not found in the correct year (by enrollment_date)'
      )
    })
  })

  describe('single academic year ranges', () => {
    // TODO: Rewrite /courseyearlystats so that total = passed + failed + enrolledNoGrade
    it.each([
      [
        '2016-2017',
        { total: 1, passed: 1, failed: 0, enrolledNoGrade: 0, extra: {} },
        { 5: 0, 4: 1, 3: 0, 2: 0, 1: 0, 0: 0, 'Hyl.': 0, 'Hyv.': 0 },
      ],
      [
        '2017-2018',
        {
          total: 26,
          passed: 19,
          failed: 7,
          enrolledNoGrade: 0,
          extra: { failed: ['455478', '457686', '474032', '497183', '509165', '547994', '550840'] },
        },
        // students.grades buckets every failing grade under '0', so 'Hyl.' is folded into it here.
        { 5: 11, 4: 5, 3: 2, 2: 1, 1: 0, 0: 7, 'Hyl.': 0, 'Hyv.': 0 },
      ],
      [
        '2018-2019',
        { total: 30, passed: 26, failed: 4, enrolledNoGrade: 0, extra: {} },
        { 5: 18, 4: 3, 3: 2, 2: 1, 1: 2, 0: 4, 'Hyl.': 0, 'Hyv.': 0 },
      ],
      [
        '2019-2020',
        { total: 28, passed: 28, failed: 0, enrolledNoGrade: 0, extra: {} },
        { 5: 17, 4: 5, 3: 1, 2: 4, 1: 1, 0: 0, 'Hyl.': 0, 'Hyv.': 0 },
      ],
      [
        '2020-2021',
        { total: 23, passed: 23, failed: 0, enrolledNoGrade: 0, extra: {} },
        { 5: 18, 4: 2, 3: 0, 2: 2, 1: 0, 0: 0, 'Hyl.': 0, 'Hyv.': 1 },
      ],
      [
        '2021-2022',
        { total: 15, passed: 15, failed: 0, enrolledNoGrade: 20, extra: {} },
        { 5: 13, 4: 2, 3: 0, 2: 0, 1: 0, 0: 0, 'Hyl.': 0, 'Hyv.': 0 },
      ],
      [
        '2022-2023',
        { total: 27, passed: 27, failed: 0, enrolledNoGrade: 34, extra: {} },
        { 5: 21, 4: 6, 3: 0, 2: 0, 1: 0, 0: 0, 'Hyl.': 0, 'Hyv.': 0 },
      ],
      [
        '2023-2024',
        { total: 1, passed: 1, failed: 0, enrolledNoGrade: 7, extra: {} },
        { 5: 1, 4: 0, 3: 0, 2: 0, 1: 0, 0: 0, 'Hyl.': 0, 'Hyv.': 0 },
      ],
    ])('should include correct stats for one academic year ($0)', async (year, categories, grades) => {
      const body = await getCourseYearlyStats(
        app,
        `courses=${TKT10002}&substitutions=false&fromYearCode=${yearToYearCode(year.split('-').at(0))}&toYearCode=${yearToYearCode(parseInt(year.split('-').at(1)!)) - 1}`
      )
      const stats = body.unifyStats.statistics.find(yearStats => yearStats.name === year)!
      assert('enrollments' in stats, 'Missing field enrollment in statsitics')

      const studentCategories = calculatePassedAndFailed(stats.students.grades)

      if (Object.keys(categories.extra).length) {
        Object.keys(categories.extra).forEach(category => {
          assert.deepStrictEqual(
            studentCategories[category as 'passed' | 'failed'].sort(),
            categories.extra[category].sort(),
            `"${category}" included incorrect students`
          )
        })
      }

      if (categories) {
        assert.strictEqual(
          studentCategories.failed.length,
          categories.failed,
          `Incorrect amount of failed students for ${year}`
        )
        assert.strictEqual(
          studentCategories.passed.length,
          categories.passed,
          `Incorrect amount of passed students for ${year}`
        )
        assert.strictEqual(
          stats.students.studentNumbers.length,
          categories.total,
          `Incorrect amount of total students for ${year}`
        )
        assert.strictEqual(
          stats.enrollments.length,
          categories.enrolledNoGrade,
          `Incorrect amount of enrolled students for ${year}`
        )
      }
      if (grades) {
        Object.entries(grades).forEach(([grade, count]) =>
          assert.strictEqual(
            stats.students.grades[grade]?.length ?? 0,
            count,
            `Incorrect amount of students with grade ${grade}`
          )
        )
      }
    })
  })
})
