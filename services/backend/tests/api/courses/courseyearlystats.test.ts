import { Express } from 'express'
import request from 'supertest'
import { describe, it, beforeAll, assert } from 'vitest'

import { Unarray } from '@oodikone/shared/types'
import { CourseYearlyStatsResBody } from '../../../src/routes/courses'
import { initTests, ResponseWithBody } from '../../utils'

void describe('Course yearly statistics', () => {
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
        .get('/courseyearlystats?codes=TKT10002&combineSubstitutions=false')
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

    it('(statistic years)', () => {
      assert.strictEqual(body.unifyStats!.statistics.length, 8, 'unifyStats years')
      assert.strictEqual(body.regularStats!.statistics.length, 8, 'regularStats years')
      assert.strictEqual(body.openStats!.statistics.length, 4, 'openStats years')

      // Faculties should have the same amount of years as normal statistics (above)
      assert.strictEqual(Object.keys(body.unifyStats!.facultyStats).length, 8, 'unifyStats years')
      assert.strictEqual(Object.keys(body.regularStats!.facultyStats).length, 8, 'regularStats years')
      assert.strictEqual(Object.keys(body.openStats!.facultyStats).length, 4, 'openStats years')
    })

    describe('(statistic contents)', () => {
      it('- 2016-2017', () => {
        const stats2016 = body.unifyStats!.statistics.find(year => year.name === '2016-2017')!
        assert.deepStrictEqual(
          stats2016.students.studentNumbers,
          ['484144'],
          'Incorrect students marked to 2016 stats (students)'
        )

        assert.deepStrictEqual(stats2016.attempts.grades['4'], ['484144'], 'Incorrect grades marked to 2016 stats (4)')
        assert.strictEqual(
          stats2016.attempts.categories.passed.length,
          1,
          'Incorrect students marked as passed to 2016 stats (passed)'
        )
        assert.strictEqual(
          stats2016.attempts.categories.failed.length,
          0,
          'Incorrect students marked as failed to 2016 stats (failed)'
        )

        assert('enrollments' in stats2016, 'Missing field enrollment in statsitics')
        assert.strictEqual(stats2016.enrollments.length, 0, 'Enrollments found when none should exist')
        assert.strictEqual(stats2016.allEnrollments.length, 0, 'Enrollments found when none should exist')
      })

      it('- 2017-2018', () => {
        const stats2017 = body.unifyStats!.statistics.find(year => year.name === '2017-2018')!

        assert.strictEqual(stats2017.attempts.grades['5'].length, 11, 'Incorrect grades marked to 2017 stats (5)')
        assert.strictEqual(stats2017.attempts.grades['4'].length, 5, 'Incorrect grades marked to 2017 stats, (4)')
        assert.strictEqual(stats2017.attempts.grades['3'].length, 2, 'Incorrect grades marked to 2017 stats (3)')
        assert.strictEqual(stats2017.attempts.grades['2'].length, 1, 'Incorrect grades marked to 2017 stats (2)')
        assert(!('1' in stats2017.attempts.grades), 'Incorrect grades marked to 2017 stats (1)')
        assert.strictEqual(stats2017.attempts.grades['Hyl.'].length, 4, 'Incorrect grades marked to 2017 stats (Hyl.)')

        assert.strictEqual(stats2017.students.studentNumbers.length, 23, 'Incorrect amount of total students 2017')

        assert.strictEqual(
          stats2017.attempts.categories.passed.length,
          11 + 5 + 2 + 1 + 0,
          'Incorrect students marked as passed to 2017 stats'
        )
        assert.strictEqual(
          stats2017.attempts.categories.failed.length,
          4,
          'Incorrect students marked as failed to 2017 stats'
        )

        // These should not exist before 21-22
        assert('enrollments' in stats2017, 'Missing field enrollment in statsitics')
        assert.strictEqual(stats2017.enrollments.length, 0, 'Enrollments found when none should exist')
        assert.strictEqual(stats2017.allEnrollments.length, 0, 'Enrollments found when none should exist')
      })

      it('- 2018-2019', () => {
        const stats2018 = body.unifyStats!.statistics.find(year => year.name === '2018-2019')!

        // There are more students that have passed this course later even though they have failed the course during 2018-2019
        assert.deepStrictEqual(
          stats2018.attempts.categories.failed,
          ['454128', '546124'],
          'Incorrect students marked as failed 2018'
        )

        assert.strictEqual(stats2018.attempts.grades['0'].length, 2)
        assert.strictEqual((stats2018.attempts.grades['Hyl.'] ?? []).length, 0)
        assert.strictEqual(stats2018.attempts.categories.failed.length, 2, 'Incorrect amount of failed students 2018')
      })

      it('- 2020-2021', () => {
        const stats2020 = body.unifyStats!.statistics.find(year => year.name === '2020-2021')!

        // These should not exist before 21-22
        assert('enrollments' in stats2020, 'Missing field enrollment in statsitics')
        assert.strictEqual(stats2020.enrollments.length, 0, 'Enrollments found when none should exist')
        assert.strictEqual(stats2020.allEnrollments.length, 0, 'Enrollments found when none should exist')
      })

      it('- 2022-2023', () => {
        const stats2022 = body.unifyStats!.statistics.find(year => year.name === '2022-2023')!
        assert('enrollments' in stats2022, 'Missing field enrollment in statsitics')

        assert.strictEqual(stats2022.students.studentNumbers.length, 27, 'Incorrect amount of total students 2022')

        assert.strictEqual(stats2022.enrollments.length, 34, 'Enrollments found when none should exist')
        assert.strictEqual(stats2022.allEnrollments.length, 43, 'Enrollments found when none should exist')
      })

      it('- 2023-2024', () => {
        const stats2023 = body.unifyStats!.statistics.find(year => year.name === '2023-2024')!
        assert.strictEqual(stats2023.students.studentNumbers.length, 1, 'Incorrect amount of total students 2023')

        assert.deepStrictEqual(
          stats2023.attempts.categories.passed,
          ['521757'],
          'Incorrect students marked as passed in 2023 stats'
        )
        assert.deepStrictEqual(
          stats2023.attempts.grades['5'],
          ['521757'],
          "Correct student doesn't exist under correct grade"
        )

        assert('enrollments' in stats2023, 'Missing field enrollment in statsitics')
        assert.strictEqual(stats2023.enrollments.length, 7, 'Enrollments found when none should exist')
        assert.strictEqual(stats2023.allEnrollments.length, 7, 'Enrollments found when none should exist')
      })
    })

    describe('should work correctly in specific cases (TKT10002)', () => {
      let body: Unarray<CourseYearlyStatsResBody>
      beforeAll(async () => {
        const res = (await request(app)
          .get('/courseyearlystats?codes=TKT10002&combineSubstitutions=false')
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
            '457686' in studentNumbers || // SPRING 2019
            '455478' in studentNumbers || // FALL 2020
            '547994' in studentNumbers // FALL 2022
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

      describe('should not count duplicate failed grades to different years', () => {
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
