import dayjs from 'dayjs'
import { parseDateRangeFromParams } from '@/services/populations/shared'
import { describe, it, assert } from 'vitest'

void describe('parseDateRangeFromParams', () => {
  it.each(['FALL', 'SPRING', ['FALL', 'SPRING']])('should return a valid start and end date ($0)', semesters => {
    const { startDate, endDate } = parseDateRangeFromParams({
      years: ['2017', '2018'],
      semesters: Array.isArray(semesters) ? semesters : [semesters],
    })

    assert(dayjs(startDate).isValid(), 'Start date is not a valid date')
    assert(dayjs(endDate).isValid(), 'End date is not a valid date')
  })

  it('should return a correct start and end date for single year and semester', () => {
    const { startDate: startDateFall, endDate: endDateFall } = parseDateRangeFromParams({
      years: ['2017'],
      semesters: ['FALL'],
    })
    assert.strictEqual(startDateFall, new Date('2017-08-01').toISOString())
    assert.strictEqual(endDateFall, new Date('2018-01-01').toISOString())

    const { startDate: startDateSpring, endDate: endDateSpring } = parseDateRangeFromParams({
      years: ['2017'],
      semesters: ['SPRING'],
    })
    assert.strictEqual(startDateSpring, new Date('2018-01-01').toISOString())
    assert.strictEqual(endDateSpring, new Date('2018-08-01').toISOString())
  })

  it('should return a correct start and end date for single year and both FALL and SPRING', () => {
    const { startDate, endDate } = parseDateRangeFromParams({ years: ['2017'], semesters: ['FALL', 'SPRING'] })
    assert.strictEqual(startDate, new Date('2017-08-01').toISOString())
    assert.strictEqual(endDate, new Date('2018-08-01').toISOString())
  })

  it('should return a correct start and end date for multiple years and single semester', () => {
    const { startDate: startDateFall, endDate: endDateFall } = parseDateRangeFromParams({
      years: ['2017', '2018'],
      semesters: ['FALL'],
    })
    assert.strictEqual(startDateFall, new Date('2017-08-01').toISOString())
    assert.strictEqual(endDateFall, new Date('2019-01-01').toISOString())

    const { startDate: startDateSpring, endDate: endDateSpring } = parseDateRangeFromParams({
      years: ['2017', '2018'],
      semesters: ['SPRING'],
    })
    assert.strictEqual(startDateSpring, new Date('2018-01-01').toISOString())
    assert.strictEqual(endDateSpring, new Date('2019-08-01').toISOString())
  })

  it('should return a correct start and end date for multiple year and both FALL and SPRING', () => {
    const { startDate, endDate } = parseDateRangeFromParams({ years: ['2017', '2018'], semesters: ['FALL', 'SPRING'] })
    assert.strictEqual(startDate, new Date('2017-08-01').toISOString())
    assert.strictEqual(endDate, new Date('2019-08-01').toISOString())
  })
})
