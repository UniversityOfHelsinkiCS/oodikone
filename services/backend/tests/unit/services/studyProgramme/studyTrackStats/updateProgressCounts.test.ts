import { describe, it, assert } from 'vitest'

import { createCredit as credit } from '@oodikone/shared/test/utils'
import { getEmptyProgressCounts, updateProgressCounts } from '@/services/studyProgramme/studyTrackStats'

const years = ['2018 - 2019', '2019 - 2020', '2020 - 2021']

const credits = [
  credit({ credits: 5, attainment_date: new Date(2019, 0, 1) }),
  credit({ credits: 10, attainment_date: new Date(2021, 0, 1) }),
]

const update = (
  progressCounts: ReturnType<typeof getEmptyProgressCounts>,
  comboProgressCounts: ReturnType<typeof getEmptyProgressCounts>,
  overrides: Partial<Parameters<typeof updateProgressCounts>[0]> = {}
) =>
  updateProgressCounts({
    progressCounts,
    comboProgressCounts,
    countAsBachelorMaster: false,
    credits,
    hasGraduated: false,
    startYear: '2020 - 2021',
    startedInProgramme: new Date(2020, 7, 1),
    bachelorsStartYear: '2018 - 2019',
    startedInBachelor: new Date(2018, 7, 1),
    studyTrack: undefined,
    years,
    ...overrides,
  })

void describe('updateProgressCounts', () => {
  it('counts graduated bachelor + master students only in combo counts by bachelor start year', () => {
    const progressCounts = getEmptyProgressCounts(years)
    const comboProgressCounts = getEmptyProgressCounts(years)

    update(progressCounts, comboProgressCounts, { countAsBachelorMaster: true, hasGraduated: true })

    assert.deepStrictEqual(comboProgressCounts.graduatedCount, { '2018 - 2019': 1, '2019 - 2020': 0, '2020 - 2021': 0 })
    assert.deepStrictEqual(progressCounts.graduatedCount, { '2018 - 2019': 0, '2019 - 2020': 0, '2020 - 2021': 0 })
  })

  it('counts graduated master students only in master counts by master start year', () => {
    const progressCounts = getEmptyProgressCounts(years)
    const comboProgressCounts = getEmptyProgressCounts(years)

    update(progressCounts, comboProgressCounts, { hasGraduated: true })

    assert.deepStrictEqual(progressCounts.graduatedCount, { '2018 - 2019': 0, '2019 - 2020': 0, '2020 - 2021': 1 })
    assert.deepStrictEqual(comboProgressCounts.graduatedCount, { '2018 - 2019': 0, '2019 - 2020': 0, '2020 - 2021': 0 })
  })

  it('does not add credit counts for graduated students', () => {
    const progressCounts = getEmptyProgressCounts(years)
    const comboProgressCounts = getEmptyProgressCounts(years)

    update(progressCounts, comboProgressCounts, { hasGraduated: true })
    update(progressCounts, comboProgressCounts, { countAsBachelorMaster: true, hasGraduated: true })

    assert.deepStrictEqual(Object.values(progressCounts.creditCounts).flat(), [])
    assert.deepStrictEqual(Object.values(comboProgressCounts.creditCounts).flat(), [])
  })

  it('counts credits of bachelor + master students from the bachelor start date', () => {
    const progressCounts = getEmptyProgressCounts(years)
    const comboProgressCounts = getEmptyProgressCounts(years)

    update(progressCounts, comboProgressCounts, { countAsBachelorMaster: true })

    assert.deepStrictEqual(comboProgressCounts.creditCounts['2018 - 2019'], [15])
    assert.deepStrictEqual(Object.values(progressCounts.creditCounts).flat(), [])
  })

  it('counts credits of master students from the master start date', () => {
    const progressCounts = getEmptyProgressCounts(years)
    const comboProgressCounts = getEmptyProgressCounts(years)

    update(progressCounts, comboProgressCounts)

    assert.deepStrictEqual(progressCounts.creditCounts['2020 - 2021'], [10])
    assert.deepStrictEqual(Object.values(comboProgressCounts.creditCounts).flat(), [])
  })

  it('uses the same start years for study track counts', () => {
    const progressCounts = getEmptyProgressCounts(years)
    const comboProgressCounts = getEmptyProgressCounts(years)

    update(progressCounts, comboProgressCounts, { countAsBachelorMaster: true, studyTrack: 'TRACK' })
    update(progressCounts, comboProgressCounts, {
      countAsBachelorMaster: true,
      hasGraduated: true,
      studyTrack: 'TRACK',
    })
    update(progressCounts, comboProgressCounts, { hasGraduated: true, studyTrack: 'TRACK' })

    assert.deepStrictEqual(comboProgressCounts.creditCountsByTrack.TRACK['2018 - 2019'], [15])
    assert.strictEqual(comboProgressCounts.graduatedCountByTrack.TRACK['2018 - 2019'], 1)
    assert.strictEqual(progressCounts.graduatedCountByTrack.TRACK['2020 - 2021'], 1)
    assert.deepStrictEqual(Object.values(progressCounts.creditCountsByTrack.TRACK).flat(), [])
  })
})
