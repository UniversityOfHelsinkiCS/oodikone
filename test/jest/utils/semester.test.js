const moment = require('moment')
const semesterUtils = require('../../../src/util/semester')

describe('Semester utils tests', () => {

  test('Get correct semester for date', () => {
    expect(semesterUtils.getSemester(moment('2018-03-03'))).toBe('SPRING')
    expect(semesterUtils.getSemester(moment('2018-09-03'))).toBe('FALL')
  })

  test('Get corret semester and year string for date', () => {
    expect(semesterUtils.getSemesterAndYear(moment('2018-03-03'))).toBe('2018-SPRING')
    expect(semesterUtils.getSemesterAndYear(moment('2018-09-03'))).toBe('2018-FALL')
  })

})
