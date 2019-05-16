const moment = require('moment')
const semesterUtils = require('../../../src/util/semester')

describe('Semester utils tests', () => {

  test('Get passing semester', () => {
    expect(semesterUtils.getPassingSemester(2018, moment('2017-09-09'))).toBe('BEFORE')
    expect(semesterUtils.getPassingSemester(2018, moment('2018-09-09'))).toBe('0-FALL')
    expect(semesterUtils.getPassingSemester(2018, moment('2019-05-01'))).toBe('0-SPRING')
    expect(semesterUtils.getPassingSemester(2018, moment('2019-09-01'))).toBe('1-FALL')
    expect(semesterUtils.getPassingSemester(2018, moment('2020-05-01'))).toBe('1-SPRING')
    expect(semesterUtils.getPassingSemester(2018, moment('2026-05-01'))).toBe('LATER')
    expect(semesterUtils.getPassingSemester(2018, moment('2018-05-01'))).toBe('BEFORE')
  })

})
