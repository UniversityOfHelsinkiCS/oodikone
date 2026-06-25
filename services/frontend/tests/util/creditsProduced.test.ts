import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { makeTableStats } from '@/util/creditsProduced'

const testData: Record<string, Record<string, number>> = {
  '2022': {
    basic: 10,
    'open-uni-hetu': 5,
    'open-uni-no-hetu': 7,
    'incoming-exchange': 1,
    separate: 19,
    agreement: 17,
    transferred: 3,
    other: 16,
  },
}

void describe('Credits produced', () => {
  void it('should return null without data', () => {
    assert.strictEqual(makeTableStats(undefined, false), null)
  })

  void it('should include correct amount of fields', () => {
    assert.strictEqual(makeTableStats(testData, false)?.data?.[0]?.length, 10) // Does not include year
    assert.strictEqual(makeTableStats(testData, false)?.titles.length, 10)
  })

  void it('total should be the sum of all values excluding transferred and other', () => {
    // Total field is the second value, first is the year
    assert.strictEqual(
      makeTableStats(testData, false)?.data.find(stat => stat[0] === '2022')?.[1],
      Object.values(testData['2022'])
        .slice(0, 6)
        .reduce((acc, num) => acc + num)
    )
  })
})
