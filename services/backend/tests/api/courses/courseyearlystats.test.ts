import { Express } from 'express'
import request from 'supertest'
import { describe, it, beforeAll, assert } from 'vitest'

import { Unarray } from '@oodikone/shared/types'
import { yearToYearCode } from '@oodikone/shared/util'
import { CourseYearlyStatsResBody } from '../../../src/routes/courses'
import { initTests, ResponseWithBody } from '../../utils'

void describe('Course yearly statistics (2016-2023)', () => {
  let app: Express
  beforeAll(async () => {
    app = await initTests()
  })

  it('should return nothing with missing parameters', async () => {
    const res = await request(app)
      .get('/courseyearlystats')
      .set('shib-session-id', 'test')
      .set('uid', 'basic')
      .set('hygroupcn', 'grp-oodikone-basic-users')

    assert.strictEqual(res.status, 422)
    assert.strictEqual(res.body?.error, 'Missing required query parameters')
  })

  describe('should return correct amount of values for a course without substitutions (TKT10002)', () => {
    let body: Unarray<CourseYearlyStatsResBody>
    beforeAll(async () => {
      const res = (await request(app)
        .get(
          `/courseyearlystats?codes=TKT10002&combineSubstitutions=false&fromYearCode=${yearToYearCode(2016)}&toYearCode=${yearToYearCode(2023)}`
        )
        .set('shib-session-id', 'test')
        .set('uid', 'basic')
        .set('hygroupcn', 'grp-oodikone-basic-users')) as ResponseWithBody<CourseYearlyStatsResBody>

      assert.strictEqual(res.status, 200)
      assert.strictEqual(res.body.length, 1, 'Query to return anything')
      body = res.body.at(0)!
      assert(
        'unifyStats' in body && 'regularStats' in body && 'openStats' in body,
        'All keys of courseyearlystats not defined'
      )
    })

    it('for statistic years', () => {
      assert.strictEqual(body.unifyStats!.statistics.length, 8, 'unifyStats years')
      assert.strictEqual(body.regularStats!.statistics.length, 8, 'regularStats years')
      assert.strictEqual(body.openStats!.statistics.length, 4, 'openStats years')

      // Faculties should have the same amount of years as normal statistics (above)
      assert.strictEqual(Object.keys(body.unifyStats!.facultyStats).length, 8, 'unifyStats years')
      assert.strictEqual(Object.keys(body.regularStats!.facultyStats).length, 8, 'regularStats years')
      assert.strictEqual(Object.keys(body.openStats!.facultyStats).length, 4, 'openStats years')
    })

    // TODO: Rewrite /courseyearlystats so that total = passed + failed + enrolledNoGrade
    it.each([
      [
        '2016-2017',
        { total: 1, passed: 1, failed: 0, enrolledNoGrade: 0 },
        { 5: 0, 4: 1, 3: 0, 2: 0, 1: 0, 0: 0, 'Hyl.': 0, 'Hyv.': 0 },
      ],
      [
        '2017-2018',
        { total: 23, passed: 19, failed: 4, enrolledNoGrade: 0 },
        { 5: 11, 4: 5, 3: 2, 2: 1, 1: 0, 0: 0, 'Hyl.': 4, 'Hyv.': 0 },
      ],
      [
        '2018-2019',
        { total: 28, passed: 26, failed: 2, enrolledNoGrade: 0 },
        { 5: 18, 4: 3, 3: 2, 2: 1, 1: 2, 0: 2, 'Hyl.': 0, 'Hyv.': 0 },
      ],
      [
        '2019-2020',
        { total: 28, passed: 28, failed: 0, enrolledNoGrade: 0 },
        { 5: 17, 4: 5, 3: 1, 2: 4, 1: 1, 0: 0, 'Hyl.': 0, 'Hyv.': 0 },
      ],
      [
        '2020-2021',
        { total: 23, passed: 23, failed: 0, enrolledNoGrade: 0 },
        { 5: 18, 4: 2, 3: 0, 2: 2, 1: 0, 0: 0, 'Hyl.': 0, 'Hyv.': 1 },
      ],
      [
        '2021-2022',
        { total: 15, passed: 15, failed: 0, enrolledNoGrade: 20 },
        { 5: 13, 4: 2, 3: 0, 2: 0, 1: 0, 0: 0, 'Hyl.': 0, 'Hyv.': 0 },
      ],
      [
        '2022-2023',
        { total: 27, passed: 27, failed: 0, enrolledNoGrade: 34 },
        { 5: 21, 4: 6, 3: 0, 2: 0, 1: 0, 0: 0, 'Hyl.': 0, 'Hyv.': 0 },
      ],
      [
        '2023-2024',
        { total: 1, passed: 1, failed: 0, enrolledNoGrade: 7 },
        { 5: 1, 4: 0, 3: 0, 2: 0, 1: 0, 0: 0, 'Hyl.': 0, 'Hyv.': 0 },
      ],
    ])('for statistic content during ($0)', (year, categories, grades) => {
      const stats = body.unifyStats!.statistics.find(yearStats => yearStats.name === year)!
      assert('enrollments' in stats, 'Missing field enrollment in statsitics')

      if (categories) {
        assert.strictEqual(
          stats.attempts.categories.failed.length,
          categories.failed,
          `Incorrect amount of failed students for ${year}`
        )
        assert.strictEqual(
          stats.attempts.categories.passed.length,
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
            stats.attempts.grades[grade]?.length ?? 0,
            count,
            `Incorrect amount of students with grade ${grade}`
          )
        )
      }
    })

    describe('should work correctly in specific cases (TKT10002)', () => {
      let body: Unarray<CourseYearlyStatsResBody>
      beforeAll(async () => {
        const res = (await request(app)
          .get(
            `/courseyearlystats?codes=TKT10002&combineSubstitutions=false&fromYearCode=${yearToYearCode(2016)}&toYearCode=${yearToYearCode(2023)}`
          )
          .set('shib-session-id', 'test')
          .set('uid', 'basic')
          .set('hygroupcn', 'grp-oodikone-basic-users')) as ResponseWithBody<CourseYearlyStatsResBody>

        assert.strictEqual(res.status, 200)
        assert.strictEqual(res.body.length, 1, 'Query to return anything')
        body = res.body.at(0)!
        assert(
          'unifyStats' in body && 'regularStats' in body && 'openStats' in body,
          'All keys of courseyearlystats not defined'
        )
      })

      it('should include students who have failed a course and then completed it only once', () => {
        const stats2017 = body.unifyStats!.statistics.find(year => year.name === '2017-2018')!
        const { studentNumbers } = stats2017.students

        assert(
          !(
            (
              '457686' in studentNumbers || // SPRING 2019
              '455478' in studentNumbers || // FALL 2020
              '547994' in studentNumbers
            ) // FALL 2022
          ),
          "Students that have completed course later should not be included in the previous year's stats"
        )

        assert(
          !body
            .unifyStats!.statistics.find(year => year.name === '2017-2018')
            ?.attempts.categories.passed.includes('457686') &&
            !body
              .unifyStats!.statistics.find(year => year.name === '2017-2018')
              ?.attempts.categories.failed.includes('457686'),
          "Student was incorrectly included to the failed course code's year stats (457686)"
        )
        assert(
          body
            .unifyStats!.statistics.find(year => year.name === '2018-2019')
            ?.attempts.categories.passed.includes('457686') &&
            body
              .unifyStats!.statistics.find(year => year.name === '2018-2019')
              ?.attempts.grades['5'].includes('457686'),
          "Student was incorrectly excluded from the passed course's completion year stats (457686)"
        )

        assert(
          !body
            .unifyStats!.statistics.find(year => year.name === '2017-2018')
            ?.attempts.categories.passed.includes('455478') &&
            !body
              .unifyStats!.statistics.find(year => year.name === '2017-2018')
              ?.attempts.categories.failed.includes('455478'),
          "Student was incorrectly included to the failed course code's year stats (455478)"
        )
        assert(
          body
            .unifyStats!.statistics.find(year => year.name === '2020-2021')
            ?.attempts.categories.passed.includes('455478') &&
            body
              .unifyStats!.statistics.find(year => year.name === '2020-2021')
              ?.attempts.grades['2'].includes('455478'),
          "Student was incorrectly excluded from the passed course's completion year stats (455478)"
        )

        assert(
          !body
            .unifyStats!.statistics.find(year => year.name === '2017-2018')
            ?.attempts.categories.passed.includes('547994') &&
            !body
              .unifyStats!.statistics.find(year => year.name === '2017-2018')
              ?.attempts.categories.failed.includes('547994'),
          "Student was incorrectly included to the failed course code's year stats (547994)"
        )
        assert(
          body
            .unifyStats!.statistics.find(year => year.name === '2022-2023')
            ?.attempts.categories.passed.includes('547994') &&
            body
              .unifyStats!.statistics.find(year => year.name === '2022-2023')
              ?.attempts.grades['5'].includes('547994'),
          "Student was incorrectly excluded from the passed course's completion year stats (547994)"
        )
      })

      it("should mark student's enrollment time correctly with mismatched semestercode and enrollment_date_time", () => {
        const stats2021 = body.unifyStats!.statistics.find(year => year.name === '2021-2022')!
        const stats2022 = body.unifyStats!.statistics.find(year => year.name === '2022-2023')!
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

    describe('should work correctly in specific cases (MAT11001)', () => {
      let body: Unarray<CourseYearlyStatsResBody>
      beforeAll(async () => {
        const res = (await request(app)
          .get('/courseyearlystats?codes=MAT11001&combineSubstitutions=false')
          .set('shib-session-id', 'test')
          .set('uid', 'basic')
          .set('hygroupcn', 'grp-oodikone-basic-users')) as ResponseWithBody<CourseYearlyStatsResBody>

        assert.strictEqual(res.status, 200)
        assert.strictEqual(res.body.length, 1)
        body = res.body.at(0)!
        assert(
          'unifyStats' in body && 'regularStats' in body && 'openStats' in body,
          'All keys of courseyearlystats not defined'
        )
      })

      it('where a student has failed a course', () => {
        const stats = body.unifyStats?.statistics!.find(year => year.name === '2018-2019')
        assert(stats && 'enrollments' in stats, 'Missing field enrollment in statsitics')

        assert(
          stats.attempts.categories.failed.includes('542874'),
          "Stats didn't include student with only failed course attainment (failed)"
        )
        assert(
          !stats.attempts.categories.passed.includes('542874'),
          'Stats did incorrectly include student with only failed course attainment (passed)'
        )
        assert(
          !stats.enrollments.map(({ studentNumber }) => studentNumber).includes('542874'),
          "Stats didn't include student with only failed course attainment (enrollments)"
        )
      })
    })

    describe('should work correctly in specific cases (MAT11002)', () => {
      let body: Unarray<CourseYearlyStatsResBody>
      beforeAll(async () => {
        const res = (await request(app)
          .get('/courseyearlystats?codes=MAT11002&combineSubstitutions=false')
          .set('shib-session-id', 'test')
          .set('uid', 'basic')
          .set('hygroupcn', 'grp-oodikone-basic-users')) as ResponseWithBody<CourseYearlyStatsResBody>

        assert.strictEqual(res.status, 200)
        assert.strictEqual(res.body.length, 1)
        body = res.body.at(0)!
        assert(
          'unifyStats' in body && 'regularStats' in body && 'openStats' in body,
          'All keys of courseyearlystats not defined'
        )
      })

      it('should not include students for AY code', () => {
        const stats = body.unifyStats?.statistics!.find(year => year.name === '2017-2018')
        assert(stats && 'enrollments' in stats, 'Missing field enrollment in statsitics')
        assert(!('534980' in stats.attempts.categories.failed))
      })

      it('should not include student with failed grade after passed grade', () => {
        const year = body.unifyStats?.statistics.find(year => year.name === '2018-2019')
        assert(year, 'Stats missing completely')
        assert(
          !year.attempts.categories.failed.includes('501716'),
          'Failed students included incorrectly the student in question'
        )
        assert(
          year.attempts.categories.passed.includes('501716'),
          "Passed students didn't include student with a passed grade"
        )
        assert(year.attempts.grades['1'].includes('501716'), 'Grades should include the student in the correct grade')
      })

      it('should include student with failed grade and passed AY grade', () => {
        const year = body.unifyStats?.statistics.find(year => year.name === '2020-2021')
        assert(year, 'Stats missing completely')
        assert(
          year.attempts.categories.failed.includes('0011812135'),
          "Failed students didn't incorrectly include student in question"
        )
        assert(
          !year.attempts.categories.passed.includes('0011812135'),
          'Passed students incorrectly included student without a passing grade'
        )
        assert(
          year.attempts.grades['Hyl.'].includes('0011812135'),
          'Grades should include the student in the correct grade'
        )
      })

      it('should include student with only approved grade', () => {
        const year = body.unifyStats?.statistics.find(year => year.name === '2022-2023')
        assert(year, 'Stats missing completely')
        assert(
          !year.attempts.categories.failed.includes('543385'),
          'Failed students included incorrectly the student in question'
        )
        assert(
          year.attempts.categories.passed.includes('543385'),
          "Passed students didn't include student with a passed grade"
        )
        assert(year.attempts.grades['5'].includes('543385'), 'Grades should include the student in the correct grade')
      })

      describe('should calculate enrollments correctly', () => {
        it('- 2021-2022', () => {
          const year = body.unifyStats?.statistics.find(year => year.name === '2021-2022')
          assert(year && 'enrollments' in year, 'Missing field enrollment in statsitics')
          assert.strictEqual(year.enrollments.length, 27, 'Incorrect amount of distinct enrolled students 2021')
          assert.strictEqual(year.allEnrollments.length, 29, 'Incorrect amount of total enrolled students 2021')
        })
        it('- 2022-2023', () => {
          const year = body.unifyStats?.statistics.find(year => year.name === '2022-2023')
          assert(year && 'enrollments' in year, 'Missing field enrollment in statsitics')
          assert.strictEqual(year.enrollments.length, 23, 'Incorrect amount of distinct enrolled students 2022')
          assert.strictEqual(year.allEnrollments.length, 26, 'Incorrect amount of total enrolled students 2022')
        })
        it('- 2023-2024', () => {
          const year = body.unifyStats?.statistics.find(year => year.name === '2023-2024')
          assert(year && 'enrollments' in year, 'Missing field enrollment in statsitics')
          assert.strictEqual(year.enrollments.length, 1, 'Incorrect amount of distinct enrolled students 2023')
          assert.strictEqual(year.allEnrollments.length, 1, 'Incorrect amount of total enrolled students 2023')
        })

        it('- total', () => {
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
              (acc, yearStats) => acc + yearStats.attempts.categories.failed.length,
              0
            ),
            1
          )
          assert.strictEqual(
            body.unifyStats?.statistics.reduce(
              (acc, yearStats) => acc + yearStats.attempts.categories.passed.length,
              0
            ),
            249
          )
        })
      })
    })

    describe('should work correctly in specific cases (MAT21003)', () => {
      describe('should not count duplicate failed grades to different years when choosing a large timespan', () => {
        let body: Unarray<CourseYearlyStatsResBody>
        beforeAll(async () => {
          const res = (await request(app)
            .get('/courseyearlystats?codes=MAT21003&combineSubstitutions=false')
            .set('shib-session-id', 'test')
            .set('uid', 'basic')
            .set('hygroupcn', 'grp-oodikone-basic-users')) as ResponseWithBody<CourseYearlyStatsResBody>

          assert.strictEqual(res.status, 200)
          assert.strictEqual(res.body.length, 1)
          body = res.body.at(0)!
          assert(
            'unifyStats' in body && 'regularStats' in body && 'openStats' in body,
            'All keys of courseyearlystats not defined'
          )
        })

        it('- 2017-2018 should not include failed grade', () => {
          const year = body.unifyStats?.statistics.find(year => year.name === '2017-2018')
          assert.strictEqual(year?.attempts.categories.failed.length, 0, 'Failed stats should not include any students')
          assert.deepStrictEqual(year?.attempts.categories.failed, [], 'Failed stats should not include any students')
        })
        it('- 2018-2019 should include a failed grade', () => {
          const year = body.unifyStats?.statistics.find(year => year.name === '2018-2019')
          assert.strictEqual(year?.attempts.categories.failed.length, 1, 'Failed stats should include only one student')
          assert.deepStrictEqual(
            year?.attempts.categories.failed,
            ['539036'],
            'Failed stats included the incorrect student'
          )
        })
      })
    })
  })

  it.todo('should return correct amount of students for a course with substitutions')
  it.todo('should return correct amount of students for multiple coursecodes without substitutions')
  it.todo('should return correct amount of students for multiple coursecodes with substitutions')
})

describe('Course yearly statistics (smaller timeframes)', () => {
  let app: Express
  beforeAll(async () => {
    app = await initTests()
  })

  it.each([
    ['2017-2018', 2017, 2017],
    ['2020-2023', 2020, 2022],
    ['2016-2024', 2016, 2023],
  ])('should include correct years for smaller timeframe (MAT21003 $0)', async (name, from, to) => {
    const res = (await request(app)
      .get(
        `/courseyearlystats?codes=MAT21003&combineSubstitutions=false&fromYearCode=${yearToYearCode(from)}&toYearCode=${yearToYearCode(to)}`
      )
      .set('shib-session-id', 'test')
      .set('uid', 'basic')
      .set('hygroupcn', 'grp-oodikone-basic-users')) as ResponseWithBody<CourseYearlyStatsResBody>

    assert.strictEqual(res.status, 200)
    assert.strictEqual(res.body.length, 1)
    const body = res.body.at(0)!

    const years: string[] = []
    for (let i = from; i <= to; i++) {
      years.push(`${i}-${i + 1}`)
    }
    assert.deepStrictEqual(
      body.unifyStats!.statistics.map(({ name }) => name),
      years,
      `${name} included incorrect years`
    )
  })

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
      { 5: 11, 4: 5, 3: 2, 2: 1, 1: 0, 0: 0, 'Hyl.': 7, 'Hyv.': 0 },
    ],
    [
      '2018-2019',
      { total: 30, passed: 26, failed: 4, enrolledNoGrade: 0, extra: {} },
      { 5: 18, 4: 3, 3: 2, 2: 1, 1: 2, 0: 3, 'Hyl.': 1, 'Hyv.': 0 },
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
  ])('should include correct stats for one academic year (TKT10002, $0)', async (year, categories, grades) => {
    const res = (await request(app)
      .get(
        `/courseyearlystats?codes=TKT10002&combineSubstitutions=false&fromYearCode=${yearToYearCode(year.split('-').at(0)!)}&toYearCode=${yearToYearCode(parseInt(year.split('-').at(1)!)) - 1}`
      )
      .set('shib-session-id', 'test')
      .set('uid', 'basic')
      .set('hygroupcn', 'grp-oodikone-basic-users')) as ResponseWithBody<CourseYearlyStatsResBody>

    assert.strictEqual(res.status, 200)
    assert.strictEqual(res.body.length, 1)
    const body = res.body.at(0)!
    assert(
      'unifyStats' in body && 'regularStats' in body && 'openStats' in body,
      'All keys of courseyearlystats not defined'
    )
    const stats = body.unifyStats!.statistics.find(yearStats => yearStats.name === year)!
    assert('enrollments' in stats, 'Missing field enrollment in statsitics')

    if (Object.keys(categories.extra).length) {
      Object.keys(categories.extra).forEach(category => {
        assert.deepStrictEqual(
          stats.attempts.categories[category].sort(),
          categories.extra[category].sort(),
          `"${category}" included incorrect students`
        )
      })
    }

    if (categories) {
      assert.strictEqual(
        stats.attempts.categories.failed.length,
        categories.failed,
        `Incorrect amount of failed students for ${year}`
      )
      assert.strictEqual(
        stats.attempts.categories.passed.length,
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
          stats.attempts.grades[grade]?.length ?? 0,
          count,
          `Incorrect amount of students with grade ${grade}`
        )
      )
    }
  })

  describe('should count duplicate grades if an attainment falls out of the timespan (MAT21003)', () => {
    it('- 2017-2018 should include a failed grade', async () => {
      const res = (await request(app)
        .get(
          `/courseyearlystats?codes=MAT21003&combineSubstitutions=false&fromYearCode=${yearToYearCode(2017)}&toYearCode=${yearToYearCode(2017)}`
        )
        .set('shib-session-id', 'test')
        .set('uid', 'basic')
        .set('hygroupcn', 'grp-oodikone-basic-users')) as ResponseWithBody<CourseYearlyStatsResBody>

      assert.strictEqual(res.status, 200)
      assert.strictEqual(res.body.length, 1)
      const body = res.body.at(0)!
      assert(
        'unifyStats' in body && 'regularStats' in body && 'openStats' in body,
        'All keys of courseyearlystats not defined'
      )
      const year = body.unifyStats!.statistics.find(year => year.name === '2017-2018')!

      assert.deepStrictEqual(year.attempts.categories.failed, ['539036'], 'Failed stats should have include a students')
      assert.strictEqual(
        year.attempts.categories.failed.length,
        1,
        'Failed stats should have included a failed student'
      )
    })

    it('- 2018-2019 should include a failed grade', async () => {
      const res = (await request(app)
        .get(
          `/courseyearlystats?codes=MAT21003&combineSubstitutions=false&fromYearCode=${yearToYearCode(2018)}&toYearCode=${yearToYearCode(2018)}`
        )
        .set('shib-session-id', 'test')
        .set('uid', 'basic')
        .set('hygroupcn', 'grp-oodikone-basic-users')) as ResponseWithBody<CourseYearlyStatsResBody>

      assert.strictEqual(res.status, 200)
      assert.strictEqual(res.body.length, 1)
      const body = res.body.at(0)!
      assert(
        'unifyStats' in body && 'regularStats' in body && 'openStats' in body,
        'All keys of courseyearlystats not defined'
      )

      const year = body.unifyStats?.statistics.find(year => year.name === '2018-2019')
      assert.deepStrictEqual(
        year?.attempts.categories.failed,
        ['539036', '540698', '542927', '544688'],
        'Failed stats included the incorrect students'
      )
      assert.strictEqual(year?.attempts.categories.failed.length, 4, 'Failed stats should include only one student')
    })
  })
})
