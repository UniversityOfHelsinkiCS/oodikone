import { yearToYearCode } from '../../../util'
import { describe, it, assert } from 'vitest'

const yearToString = (isToString: boolean) => {
  return isToString
    ? (value: number | string | undefined) => value?.toString()
    : (value: number | string | undefined) => value
}

void describe.each([
  [yearToString(false), 'number'],
  [yearToString(true), 'string'],
])('yearToYearCode with $1 arguments', (f, _type) => {
  it('should return default value when no or incorrect year given', () => {
    assert.strictEqual(yearToYearCode(f(undefined)), 1)
    assert.strictEqual(yearToYearCode(f(0)), 1)
    assert.strictEqual(yearToYearCode(f(-1950)), 1)
    assert.strictEqual(yearToYearCode(f(68)), 1) // yearCode given when year expected
  })

  it('should return a sensible value when querying a valid year', () => {
    for (let i = 0; i < 2045; i++) {
      assert.isAtMost(yearToYearCode(f(i)), 100)
    }
  })

  it('should return correct values', () => {
    // Threshold values
    assert.strictEqual(yearToYearCode(f(1950)), 1)
    assert.strictEqual(yearToYearCode(f(1951)), 2)

    // Some test years
    assert.strictEqual(yearToYearCode(f(2017)), 68)
    assert.strictEqual(yearToYearCode(f(2026)), 77)

    assert.strictEqual(yearToYearCode(f(2050)), 101)
    assert.strictEqual(yearToYearCode(f(2051)), 102)

    // Threshold values
    assert.strictEqual(yearToYearCode(f(2099)), 150)
    assert.strictEqual(yearToYearCode(f(2100)), 151)
    assert.strictEqual(yearToYearCode(f(2101)), 151)
  })

  // TODO: Should this throw is incorrect value given?
  it('should not fail when querying with yearCodes instead of years', () => {
    assert.strictEqual(yearToYearCode(f(68)), 1)
    assert.strictEqual(yearToYearCode(f(76)), 1)
  })
})
