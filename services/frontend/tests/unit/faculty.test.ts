import { assert, describe, it } from 'vitest'

import { calculateStats } from '@/util/faculty'

const creditCounts = { '2023 - 2024': [10, 50, 150], '2024 - 2025': [20] }
const graduatedCount = { '2023 - 2024': 2, '2024 - 2025': 0 }

describe('calculateStats', () => {
  it('uses plain titles when no degree is given', () => {
    const stats = calculateStats(creditCounts, graduatedCount, 180)
    assert.equal(stats?.tableTitles[0], 'Start year')
    assert.equal(stats?.tableTitles.at(-1), 'Graduated')
  })

  it('uses the start degree for both titles when graduated degree is not given', () => {
    const stats = calculateStats(creditCounts, graduatedCount, 180, { startDegree: 'bachelor' })
    assert.equal(stats?.tableTitles[0], 'Start year (bachelor)')
    assert.equal(stats?.tableTitles.at(-1), 'Graduated (bachelor)')
  })

  it('uses separate degrees for bachelor + master', () => {
    const stats = calculateStats(creditCounts, graduatedCount, 300, {
      startDegree: 'bachelor',
      graduatedDegree: 'master',
      minimumAmountOfCredits: 180,
    })
    assert.equal(stats?.tableTitles[0], 'Start year (bachelor)')
    assert.equal(stats?.tableTitles.at(-1), 'Graduated (master)')
    assert.equal(stats?.chartStats.at(-1)?.name, 'Graduated (master)')
  })

  it('counts graduated students into the last column', () => {
    const stats = calculateStats(creditCounts, graduatedCount, 180, { startDegree: 'bachelor' })
    assert.deepEqual(stats?.tableStats[0].slice(0, 2), ['2023 - 2024', 5])
    assert.equal(stats?.tableStats[0].at(-1), 2)
    assert.deepEqual(stats?.tableStats.at(-1)?.slice(0, 2), ['Total', 6])
  })
})
