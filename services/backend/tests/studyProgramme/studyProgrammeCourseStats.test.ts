import { Express } from 'express'
import assert from 'node:assert/strict'
import { describe, it, before, after } from 'node:test'
import { Sequelize } from 'sequelize'
import request from 'supertest'

import { StudyProgrammeCourse } from '@oodikone/shared/types'
import { dbConnections } from '../../src/database/connection'
import { initTests, ResponseWithBody } from '../utils'

let app: Express
let connection: Sequelize
before(async () => {
  app = await initTests()
  connection = dbConnections.sequelize
})

after(async () => {
  await connection.close()
})

void describe("Study programme's course stats", async () => {
  await it('should return data for correct courses', async () => {
    const res = (await request(app)
      .get('/studyprogrammes/KH50_001/coursestats?yearType=ACADEMIC_YEAR')
      .set('shib-session-id', 'test')
      .set('uid', 'basic')
      .set('hygroupcn', 'grp-oodikone-basic-users')) as ResponseWithBody<StudyProgrammeCourse[]>

    assert.strictEqual(res.status, 200)
    assert.strictEqual(res.body.length, 102, 'Response included incorrect amount of courses') // Not checked

    const courseCodes = res.body.map(({ code }) => code)
    assert(
      ['MAT11003', 'MAT11001', 'MAT11004', 'AYMAT11003', 'AYMAT11001', 'AYMAT11004'].every(code =>
        courseCodes.includes(code)
      ),
      'Required courses or their open uni variants missing'
    )

    assert(courseCodes.includes('MAT11015'), 'Course with no passing grades missing from statistics')
  })

  await it('should return correct data for a course', async t => {
    const res = (await request(app)
      .get('/studyprogrammes/KH50_001/coursestats?yearType=ACADEMIC_YEAR')
      .set('shib-session-id', 'test')
      .set('uid', 'basic')
      .set('hygroupcn', 'grp-oodikone-basic-users')) as ResponseWithBody<StudyProgrammeCourse[]>

    // Raja-arvot, MAT11003
    assert.strictEqual(res.status, 200)
    assert(!!res.body.find(course => course.code === 'MAT11003'), "Didn't find required course")
    const course = res.body.find(course => course.code === 'MAT11003')!

    assert.deepStrictEqual(
      Object.keys(course.years),
      ['2017', '2018', '2019', '2020', '2021', '2022', '2023'],
      'Years should also include years where no credits were completed but enrollments were made'
    )
    assert.strictEqual(Object.keys(course.years).length, 7, 'Incorrect amount of years')

    await t.test('- 2017-2018', () => {
      const year = course.years['2017']
      assert.strictEqual(year.allPassed, 44, 'Incorrect amount of passed students (2017)')
      assert.strictEqual(year.allNotPassed, 0, 'Stats should not include failed or not enrolled students (2017)')
    })

    await t.test('- 2018-2019', () => {
      const year = course.years['2018']
      assert.strictEqual(year.allPassed, 70, 'Incorrect amount of passed students (2018)')
      assert.strictEqual(year.allNotPassed, 0, 'Stats should not include failed or not enrolled students (2018)')
    })

    await t.test('- 2019-2020', () => {
      const year = course.years['2019']
      assert.strictEqual(year.allPassed, 42, 'Incorrect amount of passed students (2019)')
      assert.strictEqual(year.allNotPassed, 1, 'Stats should include one failed student (2019)')
    })

    await t.test('- 2020-2021', () => {
      const year = course.years['2020']
      assert.strictEqual(year.allPassed, 33, 'Incorrect amount of passed students (2020)')
      assert.strictEqual(year.allNotPassed, 0, 'Stats should include one failed student (2020)')
    })

    await t.test('- 2021-2022', () => {
      const year = course.years['2021']
      assert.strictEqual(year.allPassed, 40, 'Incorrect amount of passed students (2021)')
      assert.strictEqual(year.allNotPassed, 6, 'Stats should include one failed student (2021)')
    })

    await t.test('- 2022-2023', () => {
      const year = course.years['2022']
      assert.strictEqual(year.allPassed, 20, 'Incorrect amount of passed students (2022)')
      assert.strictEqual(year.allNotPassed, 5, 'Stats should include one failed student (2022)')
    })

    await t.test('- 2023-2024', () => {
      const year = course.years['2023']
      assert.strictEqual(year.allPassed, 0, 'Incorrect amount of passed students (2023)')
      assert.strictEqual(year.allNotPassed, 10, 'Stats should include one failed student (2023)')
    })

    await t.test('- total', () => {
      const years = Object.values(course.years)
      assert.strictEqual(
        years.reduce((acc, year) => acc + year.allPassed, 0),
        249,
        'Total number of passed students incorrect (total)'
      )
      assert.strictEqual(
        years.reduce((acc, year) => acc + year.allNotPassed, 0),
        21 + 1,
        'Total number of failed or not enrolled students incorrect (total)'
      )
      assert.strictEqual(
        years.reduce((acc, year) => acc + year.allStudents, 0),
        271,
        'Total number of students incorrect (total)'
      )
    })
  })

  // TODO: Move somewhere else
  await it.todo('should return matching data to /courseyearlystats')
})
