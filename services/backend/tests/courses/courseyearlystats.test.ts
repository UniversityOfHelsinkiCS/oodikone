import { Express } from 'express'
import assert from 'node:assert/strict'
import { describe, it, before, after } from 'node:test'
import { Sequelize } from 'sequelize'
import request, { Response } from 'supertest'

import { dbConnections } from '../../src/database/connection'
import { CourseYearlyStatsResBody } from '../../src/routes/courses'
import { initTests } from '../utils'

let app: Express
let connection: Sequelize
before(async () => {
  app = await initTests()
  connection = dbConnections.sequelize
})

after(async () => {
  await connection.close()
})

// Override Supertest's Response body with our own type
type ResponseWithBody<T> = Omit<Response, 'body'> & { body: T }

void describe('Course yearly statistics', async () => {
  await it('should return nothing with missing parameters', async () => {
    const res = await request(app)
      .get('/courseyearlystats')
      .set('shib-session-id', 'test')
      .set('uid', 'basic')
      .set('hygroupcn', 'grp-oodikone-basic-users')

    assert.strictEqual(res.status, 422)
    assert.strictEqual(res.body?.error, 'Missing required query parameters')
  })

  await it('should return correct amount of values for a course without substitutions', async t => {
    const res = (await request(app)
      .get('/courseyearlystats?codes=TKT10002&combineSubstitutions=false')
      .set('shib-session-id', 'test')
      .set('uid', 'basic')
      .set('hygroupcn', 'grp-oodikone-basic-users')) as ResponseWithBody<CourseYearlyStatsResBody>

    assert.strictEqual(res.status, 200)
    assert.strictEqual(res.body.length, 1, 'Query to return anything')
    const body = res.body.at(0)!
    assert(
      'unifyStats' in body && 'regularStats' in body && 'openStats' in body,
      'All keys of courseyearlystats not defined'
    )

    await t.test('(statistic years)', () => {
      assert.strictEqual(body.unifyStats!.statistics.length, 8, 'unifyStats years')
      assert.strictEqual(body.regularStats!.statistics.length, 8, 'regularStats years')
      assert.strictEqual(body.openStats!.statistics.length, 4, 'openStats years')

      // Faculties should have the same amount of years as normal statistics (above)
      assert.strictEqual(Object.keys(body.unifyStats!.facultyStats).length, 8, 'unifyStats years')
      assert.strictEqual(Object.keys(body.regularStats!.facultyStats).length, 8, 'regularStats years')
      assert.strictEqual(Object.keys(body.openStats!.facultyStats).length, 4, 'openStats years')
    })

    await t.test('(statistic contents)', async tt => {
      await tt.test('- 2016-2017', () => {
        const stats2016 = body.unifyStats!.statistics.find(year => year.name === '2016-2017')!
        assert.deepStrictEqual(stats2016.students.studentNumbers, ['484144'], 'Incorrect students marked to 2016 stats')

        assert.deepStrictEqual(stats2016.attempts.grades['4'], ['484144'], 'Incorrect grades marked to 2016 stats')
        assert.strictEqual(
          stats2016.attempts.categories.passed.length,
          1,
          'Incorrect students marked as passed to 2016 stats'
        )
        assert.strictEqual(
          stats2016.attempts.categories.failed.length,
          0,
          'Incorrect students marked as failed to 2016 stats'
        )

        assert('enrollments' in stats2016, 'Missing field enrollment in statsitics')
        assert.strictEqual(stats2016.enrollments.length, 0, 'Enrollments found when none should exist')
        assert.strictEqual(stats2016.allEnrollments.length, 0, 'Enrollments found when none should exist')
      })

      await tt.test('- 2017-2018', () => {
        const stats2017 = body.unifyStats!.statistics.find(year => year.name === '2017-2018')!
        const { studentNumbers } = stats2017.students
        assert(
          !('509165' in studentNumbers || '455478' in studentNumbers || '457686' in studentNumbers),
          "Students that have completed course later should not be included in the previous year's stats"
        )
        assert.strictEqual(stats2017.students.studentNumbers.length, 23, 'Incorrect amount of total students 2017')

        assert.strictEqual(stats2017.attempts.grades['5'].length, 11, 'Incorrect grades marked to 2017 stats (5)')
        assert.strictEqual(stats2017.attempts.grades['4'].length, 5, 'Incorrect grades marked to 2017 stats, (4)')
        assert.strictEqual(stats2017.attempts.grades['3'].length, 2, 'Incorrect grades marked to 2017 stats (3)')
        assert.strictEqual(stats2017.attempts.grades['2'].length, 1, 'Incorrect grades marked to 2017 stats (2)')
        assert(!('1' in stats2017.attempts.grades), 'Incorrect grades marked to 2017 stats (1)')
        assert.strictEqual(stats2017.attempts.grades['Hyl.'].length, 4, 'Incorrect grades marked to 2017 stats (Hyl.)')

        assert(
          !stats2017.attempts.grades['Hyl.'].includes('455478'),
          "Specific student's failed grade is not marked to the correct year (should be only in passed 2020-2021)"
        )

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

      await tt.test('- 2020-2021', () => {
        const stats2020 = body.unifyStats!.statistics.find(year => year.name === '2020-2021')!
        assert(
          stats2020.attempts.categories.passed.includes('455478'),
          "Specific student's passed course is not marked to the correct year (passed)"
        )
        assert(
          stats2020.attempts.grades['2'].includes('455478'),
          "Specific student's passed course is not marked to the correct year (grade)"
        )

        // These should not exist before 21-22
        assert('enrollments' in stats2020, 'Missing field enrollment in statsitics')
        assert.strictEqual(stats2020.enrollments.length, 0, 'Enrollments found when none should exist')
        assert.strictEqual(stats2020.allEnrollments.length, 0, 'Enrollments found when none should exist')
      })

      // TODO: This should be fixed by course_unit_realisation
      await tt.test('- 2022-2023', () => {
        const stats2022 = body.unifyStats!.statistics.find(year => year.name === '2022-2023')!
        assert.strictEqual(stats2022.students.studentNumbers.length, 27, 'Incorrect amount of total students 2022')

        assert('enrollments' in stats2022, 'Missing field enrollment in statsitics')
        // Student with enrollment_date_time outside of semestert start and end dates
        assert(
          !!stats2022.enrollments.find(enrollment => enrollment.studentNumber === '455129'),
          'Student with incorrect semester (by updater) but a correct enrollment_date was not found in the correct year (by enrollment_date)'
        )
        assert.strictEqual(stats2022.enrollments.length, 34, 'Enrollments found when none should exist')
        assert.strictEqual(stats2022.allEnrollments.length, 43, 'Enrollments found when none should exist')
      })

      await tt.test('- 2023-2024', () => {
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

    await it.todo('should return correct amount of students for a course with substitutions')
    await it.todo('should return correct amount of students for multiple coursecodes without substitutions')
    await it.todo('should return correct amount of students for multiple coursecodes with substitutions')
  })
})
