import { yearCodeToYear } from '../../../util'
import { describe, it, assert } from 'vitest'

const yearToString = (isToString: boolean) => {
  return isToString
    ? (value: number | string | undefined) => value?.toString()
    : (value: number | string | undefined) => value
}

void describe.each([
  [yearToString(false), 'number'],
  [yearToString(true), 'string'],
])('yearCodeToYear with $1 arguments', (f, _type) => {
  it('should return default value when no or incorrect yearCode given', () => {
    assert.strictEqual(yearCodeToYear(f(undefined)), 1950)
    assert.strictEqual(yearCodeToYear(f(0)), 1950)
    assert.strictEqual(yearCodeToYear(f(-1)), 1950)
  })

  it('should return a sensible value when querying a valid year', () => {
    for (let i = 0; i < 100; i++) {
      assert.isAtMost(yearCodeToYear(f(i)), 2050)
    }
  })

  it('should return correct values', () => {
    // Threshold values
    assert.strictEqual(yearCodeToYear(f(1)), 1950)
    assert.strictEqual(yearCodeToYear(f(2)), 1951)

    // Some test years
    assert.strictEqual(yearCodeToYear(f(68)), 2017)
    assert.strictEqual(yearCodeToYear(f(77)), 2026)

    assert.strictEqual(yearCodeToYear(f(101)), 2050)
    assert.strictEqual(yearCodeToYear(f(102)), 2051)

    // Threshold values
    assert.strictEqual(yearCodeToYear(f(150)), 2099)
    assert.strictEqual(yearCodeToYear(f(151)), 2100)
    assert.strictEqual(yearCodeToYear(f(152)), 2100)
  })

  // TODO: Should this throw is incorrect value given?
  it('should not fail when querying with years instead of yearCodes', () => {
    // year given when yearCode expected
    assert.strictEqual(yearCodeToYear(f(-1950)), 1950)
    assert.strictEqual(yearCodeToYear(f(1950)), 2100)
  })
})
