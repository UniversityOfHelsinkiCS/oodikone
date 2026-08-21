import { describe, it, assert } from 'vitest'
import { combineStats } from '@/services/studyProgramme/studyTrackStats'
import { getPercentage } from '@/services/studyProgramme/studyProgrammeHelpers'

const constructStats = (mainStatsByYear = {}, mainStatsByTrack = {}, otherCountriesCount = {}) => {
  return {
    mainStatsByYear,
    mainStatsByTrack,
    otherCountriesCount,
  }
}

const constructEmptyYearArray = (years: string[]) =>
  years.map(year => [
    year,
    0, // yearStats.all,
    0, // yearStats.started,
    getPercentage(0, 0), // getPercentage(yearStats.started, yearStats.all),
    0, // yearStats.present,
    getPercentage(0, 0), // getPercentage(yearStats.present, yearStats.all),
    0, // yearStats.absent,
    getPercentage(0, 0), // getPercentage(yearStats.absent, yearStats.all),
    0, // yearStats.passive,
    getPercentage(0, 0), // getPercentage(yearStats.passive, yearStats.all),
    0, // yearStats.graduated,
    getPercentage(0, 0), // getPercentage(yearStats.graduated, yearStats.all),
    0, // yearStats.cancelled,
    getPercentage(0, 0), // getPercentage(yearStats.cancelled, yearStats.all),
    0, // yearStats.attainmentWithinYear,
    getPercentage(0, 0), // getPercentage(yearStats.attainmentWithinYear, yearStats.all),
    0, // yearStats.male,
    getPercentage(0, 0), // getPercentage(yearStats.male, yearStats.all),
    0, // yearStats.female,
    getPercentage(0, 0), // getPercentage(yearStats.female, yearStats.all),
    0, // yearStats.otherUnknown,
    getPercentage(0, 0), // getPercentage(yearStats.otherUnknown, yearStats.all),
    0, // yearStats.finnish,
    getPercentage(0, 0), // getPercentage(yearStats.finnish, yearStats.all),
    0, // yearStats.otherCountries,
    getPercentage(0, 0), // getPercentage(yearStats.otherCountries, yearStats.all),
  ])

const constructEmptyYearlyStats = () => ({
  all: 0,
  started: 0,
  present: 0,
  absent: 0,
  passive: 0,
  cancelled: 0,
  graduated: 0,
  graduatedCombinedProgramme: 0,
  attainmentWithinYear: 0,
  male: 0,
  female: 0,
  otherUnknown: 0,
  finnish: 0,
  otherCountries: 0,
  otherCountriesCounts: {} as Record<string, number>,
})

void describe('Combine stats', () => {
  it('should return nothing with empty years', () => {
    assert.deepStrictEqual(combineStats([], {}, 'KH50_001'), constructStats())
  })

  it('should return stats with all 0 for years without stats', () => {
    assert.deepStrictEqual(
      combineStats(['2025 - 2026'], {}, 'KH50_001'),
      constructStats(
        { '2025 - 2026': constructEmptyYearArray(['2025 - 2026']) },
        { KH50_001: constructEmptyYearArray(['2025 - 2026']) }
      )
    )
  })

  it('should return correct stats for single year with stats', () => {
    const yearlyStats = constructEmptyYearlyStats()
    assert.deepStrictEqual(
      combineStats(['2025 - 2026'], { '2025 - 2026': { KH50_001: yearlyStats } }, 'KH50_001'),
      constructStats(
        { '2025 - 2026': constructEmptyYearArray(['2025 - 2026']) },
        { KH50_001: constructEmptyYearArray(['2025 - 2026']) }
      )
    )
  })

  it.todo('should return correct calculations for acual yearlyStats')
})
