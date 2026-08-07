import { describe, it, assert, vi, beforeAll } from 'vitest'
import {
  getPercentage,
  getYearsArray,
  getYearsObject,
} from '../../../../src/services/studyProgramme/studyProgrammeHelpers'

void describe('Get years object', () => {
  it('should return nothing with empty years', () => {
    assert.deepStrictEqual(getYearsObject({ years: [] }), {})
    assert.deepStrictEqual(getYearsObject({ years: [], emptyArrays: false }), {})
    assert.deepStrictEqual(getYearsObject({ years: [], emptyArrays: true }), {})
  })

  it('should return correct values for single year', () => {
    assert.deepStrictEqual(getYearsObject({ years: ['2025 - 2026'] }), { '2025 - 2026': 0 })
    assert.deepStrictEqual(getYearsObject({ years: ['2025 - 2026'], emptyArrays: false }), { '2025 - 2026': 0 })
    assert.deepStrictEqual(getYearsObject({ years: ['2025 - 2026'], emptyArrays: true }), { '2025 - 2026': [] })
  })

  it('should return correct values for multiple years', () => {
    assert.deepStrictEqual(getYearsObject({ years: ['2025 - 2026', '2026 - 2027'] }), {
      '2025 - 2026': 0,
      '2026 - 2027': 0,
    })
    assert.deepStrictEqual(getYearsObject({ years: ['2025 - 2026', '2026 - 2027'], emptyArrays: false }), {
      '2025 - 2026': 0,
      '2026 - 2027': 0,
    })
    assert.deepStrictEqual(getYearsObject({ years: ['2025 - 2026', '2026 - 2027'], emptyArrays: true }), {
      '2025 - 2026': [],
      '2026 - 2027': [],
    })
  })
})

void describe('Get years array', () => {
  beforeAll(() => {
    const mockedCurrentDate = new Date('2026-03-01')
    vi.useFakeTimers()
    vi.setSystemTime(mockedCurrentDate)

    assert.deepStrictEqual(mockedCurrentDate, new Date())
  })

  it('should return nothing for years since next year', () => {
    assert.deepStrictEqual(getYearsArray(new Date().getFullYear() + 1, true), [])
    assert.deepStrictEqual(getYearsArray(new Date().getFullYear() + 1, false), [])

    assert.deepStrictEqual(getYearsArray(new Date().getFullYear() + 1, false, false), [])
    assert.deepStrictEqual(getYearsArray(new Date().getFullYear() + 1, true, true), ['Total'])
  })

  it('should return correct years for since this year but during previous academic year', () => {
    assert.deepStrictEqual(getYearsArray(new Date().getFullYear(), true), [])
    assert.deepStrictEqual(getYearsArray(new Date().getFullYear(), false), [2026])

    assert.deepStrictEqual(getYearsArray(new Date().getFullYear(), true, true), ['Total'])
    assert.deepStrictEqual(getYearsArray(new Date().getFullYear(), false, true), ['Total', 2026])
  })

  it('should return correct years for since couple years back', () => {
    assert.deepStrictEqual(getYearsArray(new Date().getFullYear() - 2, true), ['2024 - 2025', '2025 - 2026'])
    assert.deepStrictEqual(getYearsArray(new Date().getFullYear() - 2, false), [2024, 2025, 2026])

    assert.deepStrictEqual(getYearsArray(new Date().getFullYear() - 2, true, true), [
      'Total',
      '2024 - 2025',
      '2025 - 2026',
    ])
    assert.deepStrictEqual(getYearsArray(new Date().getFullYear() - 2, false, true), ['Total', 2024, 2025, 2026])
  })

  it('should return thousands of years for since year 0', () => {
    assert.deepStrictEqual(getYearsArray(0, true).length, 2026)
    assert.deepStrictEqual(getYearsArray(0, false).length, 2026 + 1) // Academic vs calendar year
  })
})

void describe('Get percentage', () => {
  it('should return NA for non-number values', () => {
    assert.strictEqual(getPercentage(undefined, null), 'NA')
    assert.strictEqual(getPercentage('30', '50'), 'NA')
    assert.strictEqual(getPercentage(30, '50'), 'NA')
    assert.strictEqual(getPercentage('30', 50), 'NA')
  })

  it('should return NA for total of 0', () => {
    assert.strictEqual(getPercentage(10, 0), 'NA')
  })

  it('should return correct division result for correct values', () => {
    assert.strictEqual(getPercentage(5, 10), '50.0 %')
    assert.strictEqual(getPercentage(10, 10), '100.0 %')
    assert.strictEqual(getPercentage(6, 7), '85.7 %')

    // Should this be allowed :D
    assert.strictEqual(getPercentage(5, -10), '-50.0 %')
    assert.strictEqual(getPercentage(-5, 10), '-50.0 %')
  })
})
