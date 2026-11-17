import { Express } from 'express'
import request from 'supertest'
import { describe, it, beforeAll, assert } from 'vitest'

import { StudyProgrammeCourse } from '@oodikone/shared/types'
import { initTests, ResponseWithBody } from '../../utils'
import { yearToYearCode } from '@oodikone/shared/util'

const testData = [
  {
    // Johdatus yliopistomatematiikkaan, MAT11001
    courseCode: 'MAT11001',
    // year: [allPassed, allNotPassed]
    2023: [0, 9],
    2022: [17, 3],
    2021: [29, 6],
    2020: [39, 0],
    2019: [48, 0],
    2018: [69, 1],
    2017: [51, 0],
    // total: [allPassed, allNotPassed, allStudents]
    total: [253, 18 + 1, 253 + 18 + 1],
  },

  {
    // Lineaarialgebra ja matriisilaskenta I, MAT11002
    courseCode: 'MAT11002',
    // year: [allPassed, allNotPassed]
    2023: [0, 1],
    2022: [20, 1],
    2021: [22, 2],
    2020: [45, 1],
    2019: [51, 0],
    2018: [57, 0],
    2017: [47, 0],
    // total: [allPassed, allNotPassed, allStudents]
    total: [242, 4 + 1, 242 + 4 + 1],
  },
  {
    // Raja-arvot, MAT11003
    courseCode: 'MAT11003',
    // year: [allPassed, allNotPassed]
    2023: [0, 10],
    2022: [20, 5],
    2021: [40, 5],
    2020: [33, 0],
    2019: [42, 1],
    2018: [70, 0],
    2017: [44, 0],
    // total: [allPassed, allNotPassed, allStudents]
    total: [249, 20 + 1, 249 + 20 + 1],
  },

  {
    // Lineaarialgebra ja matriisilaskenta II, MAT21001
    courseCode: 'MAT21001',
    // year: [allPassed, allNotPassed]
    2023: [1, 0],
    2022: [22, 6],
    2021: [20, 4],
    2020: [36, 4],
    2019: [45, 0],
    2018: [56, 0],
    2017: [36, 0],
    // total: [allPassed, allNotPassed, allStudents]
    total: [216, 4 + 10, 216 + 4 + 10],
  },

  {
    // Vektorianalyysi I, MAT21001
    courseCode: 'MAT21003',
    // year: [allPassed, allNotPassed]
    2023: [1, 20],
    2022: [21, 1],
    2021: [35, 2],
    2020: [62, 1],
    2019: [56, 1],
    2018: [27, 1],
    2017: [0, 0],
    // total: [allPassed, allNotPassed, allStudents]
    total: [202, 3 + 23, 202 + 3 + 23],
  },
]

/** This mostly checks that values are the same as in Course stats */
void describe("Study programme's course stats (all years)", () => {
  let app: Express
  beforeAll(async () => {
    app = await initTests()
  })

  it('should return data for correct courses', async () => {
    const res = (await request(app)
      .get('/studyprogrammes/KH50_001/coursestats?yearType=ACADEMIC_YEAR')
      .set('shib-session-id', 'test')
      .set('uid', 'basic')
      .set('hygroupcn', 'grp-oodikone-basic-users')) as ResponseWithBody<StudyProgrammeCourse[]>

    assert.strictEqual(res.status, 200)
    assert.strictEqual(res.body.length, 86, 'Response included incorrect amount of courses') // Not checked number

    const courseCodes = res.body.map(({ code }) => code)
    assert.includeMembers(
      courseCodes,
      ['MAT11003', 'MAT11001', 'MAT11004' /* , 'AYMAT11003', 'AYMAT11001', 'AYMAT11004' */], // AY codes were previously required
      'Required courses or their open uni variants missing'
    )

    assert(courseCodes.includes('MAT11015'), 'Course with no passing grades missing from statistics')
  })

  describe.each(testData)(
    'should return correct data for a course ($courseCode)',
    ({ courseCode, total, ...years }) => {
      let course: StudyProgrammeCourse
      beforeAll(async () => {
        const res = (await request(app)
          .get('/studyprogrammes/KH50_001/coursestats?yearType=ACADEMIC_YEAR')
          .set('shib-session-id', 'test')
          .set('uid', 'basic')
          .set('hygroupcn', 'grp-oodikone-basic-users')) as ResponseWithBody<StudyProgrammeCourse[]>

        assert.strictEqual(res.status, 200)
        assert(!!res.body.find(course => course.code === courseCode), "Didn't find required course")
        course = res.body.find(course => course.code === courseCode)!

        assert.deepStrictEqual(
          Object.keys(course.years),
          ['2017', '2018', '2019', '2020', '2021', '2022', '2023'], // This doesn't necessarily hold for all courses
          'Years should also include years where no credits were completed but enrollments were made'
        )
        assert.strictEqual(Object.keys(course.years).length, 7, 'Incorrect amount of years')
      })

      it.each(Object.entries(years))('- %s', (year, stats) => {
        const yearStats = course.years[parseInt(year)]
        assert.strictEqual(yearStats.allPassed, stats.at(0), `Incorrect amount of Passed students (${year}})`)
        assert.strictEqual(yearStats.allNotPassed, stats.at(1), `Incorrect amount of Not passed students (${year})`)
      })

      it('- total', () => {
        const years = Object.values(course.years)
        assert.strictEqual(
          years.reduce((acc, year) => acc + year.allPassed, 0),
          total.at(0),
          'Total number of passed students incorrect (total)'
        )
        assert.strictEqual(
          years.reduce((acc, year) => acc + year.allNotPassed, 0),
          total.at(1),
          'Total number of failed or not enrolled students incorrect (total)'
        )
        assert.strictEqual(
          years.reduce((acc, year) => acc + year.allStudents, 0),
          total.at(2),
          'Total number of students incorrect (total)'
        )
      })
    }
  )

  describe('should work correctly in specific cases', () => {
    // Lineaarialgebra ja matriisilaskenta I (MAT11002)
    it('Student with AY code attainment should not be calculated into original course code stats (MAT11002, 534980)', async () => {
      const res = (await request(app)
        .get('/studyprogrammes/KH50_001/coursestats?yearType=ACADEMIC_YEAR')
        .set('shib-session-id', 'test')
        .set('uid', 'basic')
        .set('hygroupcn', 'grp-oodikone-basic-users')) as ResponseWithBody<StudyProgrammeCourse[]>

      assert.strictEqual(res.status, 200)
      assert(!!res.body.find(course => course.code === 'MAT11002'), "Didn't find required course")
      const course = res.body.find(course => course.code === 'MAT11002')!

      assert.strictEqual(
        course.years['2017'].allNotPassed,
        0,
        'Most likely student with AY code is calculated into stats (not passed)'
      )
      assert.strictEqual(
        course.years['2017'].allPassed,
        47,
        'Most likely student with AY code is calculated into stats (passed)'
      )
      assert.strictEqual(
        course.years['2017'].allStudents,
        47,
        'Most likely student with AY code is calculated into stats (total)'
      )
    })

    // Todennäköisyyslaskenta I (MAT11001)
    it('Student with multiple enrollments in different years should only be counted once (MAT11001)', async () => {
      const res = (await request(app)
        .get('/studyprogrammes/KH50_001/coursestats?yearType=ACADEMIC_YEAR')
        .set('shib-session-id', 'test')
        .set('uid', 'basic')
        .set('hygroupcn', 'grp-oodikone-basic-users')) as ResponseWithBody<StudyProgrammeCourse[]>

      assert.strictEqual(res.status, 200)
      assert(!!res.body.find(course => course.code === 'MAT11001'), "Didn't find required course")
      const year = res.body.find(course => course.code === 'MAT11001')?.years['2022']
      assert.strictEqual(year?.allPassed, 17, 'Incorrect amount of Passed')
      assert.strictEqual(year?.allNotPassed, 3, 'Incorrect amount of Not completed')
      assert.strictEqual(year?.allStudents, 20, 'Incorrect amount of Total students')
    })
  })
})

void describe("Study programme's course stats (single year)", () => {
  let app: Express
  beforeAll(async () => {
    app = await initTests()
  })

  it('should return stats for only queried years', async () => {
    const res = (await request(app)
      .get('/studyprogrammes/KH50_001/coursestats?yearType=ACADEMIC_YEAR&fromYearCode=68&toYearCode=68&')
      .set('shib-session-id', 'test')
      .set('uid', 'basic')
      .set('hygroupcn', 'grp-oodikone-basic-users')) as ResponseWithBody<StudyProgrammeCourse[]>

    assert.strictEqual(res.status, 200)

    assert(!!res.body.find(course => course.code === 'MAT11002'), "Didn't find required course")
    const course = res.body.find(course => course.code === 'MAT11002')!

    assert.deepStrictEqual(
      Object.keys(course.years),
      ['2017'],
      'Returned stats for incorrect years when querying only 2017'
    )
    assert.strictEqual(
      Object.keys(course.years).length,
      1,
      'Returned incorrect amount of years when querying only 2017'
    )
  })

  it('should count student with multiple grades multiple times in their respective years', async () => {
    const res2017 = (await request(app)
      .get(
        `/studyprogrammes/KH50_001/coursestats?yearType=ACADEMIC_YEAR&fromYearCode=${yearToYearCode(2017)}&toYearCode=${yearToYearCode(2017)}&`
      )
      .set('shib-session-id', 'test')
      .set('uid', 'basic')
      .set('hygroupcn', 'grp-oodikone-basic-users')) as ResponseWithBody<StudyProgrammeCourse[]>

    const res2018 = (await request(app)
      .get(
        `/studyprogrammes/KH50_001/coursestats?yearType=ACADEMIC_YEAR&fromYearCode=${yearToYearCode(2018)}&toYearCode=${yearToYearCode(2018)}&`
      )
      .set('shib-session-id', 'test')
      .set('uid', 'basic')
      .set('hygroupcn', 'grp-oodikone-basic-users')) as ResponseWithBody<StudyProgrammeCourse[]>

    // 2017
    assert.strictEqual(res2017.status, 200)
    assert(!!res2017.body.find(course => course.code === 'MAT21003'), "Didn't find required course")
    const course2017 = res2017.body.find(course => course.code === 'MAT21003')!

    assert('2017' in course2017.years, 'Stats for 2017 not found')
    assert.strictEqual(course2017.years['2017'].allNotPassed, 1, 'Failed students should include only 539036')

    // 2018
    assert.strictEqual(res2018.status, 200)
    assert(!!res2018.body.find(course => course.code === 'MAT21003'), "Didn't find required course")
    const course2018 = res2018.body.find(course => course.code === 'MAT21003')!

    assert('2018' in course2018.years, 'Stats for 2018 not found')
    assert.strictEqual(
      course2018.years['2018'].allNotPassed,
      4,
      'Failed students should include 539036, 540698, 542927 and 544688'
    )
  })
})

void describe("Study programme's course stats (few years)", () => {
  let app: Express
  beforeAll(async () => {
    app = await initTests()
  })

  it('should return stats for only queried years', async () => {
    const res = (await request(app)
      .get(
        `/studyprogrammes/KH50_001/coursestats?yearType=ACADEMIC_YEAR&fromYearCode=${yearToYearCode(2017)}&toYearCode=${yearToYearCode(2018)}&`
      )
      .set('shib-session-id', 'test')
      .set('uid', 'basic')
      .set('hygroupcn', 'grp-oodikone-basic-users')) as ResponseWithBody<StudyProgrammeCourse[]>

    assert.strictEqual(res.status, 200)

    assert(!!res.body.find(course => course.code === 'MAT11002'), "Didn't find required course")
    const course = res.body.find(course => course.code === 'MAT11002')!

    assert.deepStrictEqual(
      Object.keys(course.years),
      ['2017', '2018'],
      'Returned stats for incorrect years when querying 2017-2018'
    )
    assert.strictEqual(
      Object.keys(course.years).length,
      2,
      'Returned incorrect amount of years when querying only 2017-2018'
    )
  })

  it('should count student with multiple grades only once inside the timeframe', async () => {
    const res = (await request(app)
      .get(
        `/studyprogrammes/KH50_001/coursestats?yearType=ACADEMIC_YEAR&fromYearCode=${yearToYearCode(2017)}&toYearCode=${yearToYearCode(2018)}&`
      )
      .set('shib-session-id', 'test')
      .set('uid', 'basic')
      .set('hygroupcn', 'grp-oodikone-basic-users')) as ResponseWithBody<StudyProgrammeCourse[]>

    assert.strictEqual(res.status, 200)
    assert(!!res.body.find(course => course.code === 'MAT21003'), "Didn't find required course")
    const course = res.body.find(course => course.code === 'MAT21003')!

    assert('2017' in course.years, 'Stats for 2017 not found')
    assert.strictEqual(course.years['2017'].allNotPassed, 0, 'Failed students should not contain anything')

    assert('2018' in course.years, 'Stats for 2018 not found')
    assert.strictEqual(
      course.years['2018'].allNotPassed,
      4,
      'Failed students should include 539036, 540698, 542927 and 544688'
    )
  })
})
