import { assert, describe, it } from 'vitest'

import { buildSectionUrl, toSectionSlug } from '@/components/Section/sectionLink'

describe('toSectionSlug', () => {
  it('lowercases and joins words with dashes', () => {
    assert.equal(toSectionSlug('Progress of students by starting year'), 'progress-of-students-by-starting-year')
  })

  it('collapses punctuation and trims leading and trailing dashes', () => {
    assert.equal(toSectionSlug('  Update (students & courses)!  '), 'update-students-courses')
  })

  it('keeps non-ascii letters and numbers', () => {
    assert.equal(toSectionSlug('Opintopisteet ÄÖÅ 2024'), 'opintopisteet-äöå-2024')
  })
})

describe('buildSectionUrl', () => {
  it('adds the section param and keeps existing params', () => {
    assert.equal(
      buildSectionUrl('http://localhost:3000/faculties/H10?tab=2', 'master'),
      'http://localhost:3000/faculties/H10?tab=2&section=master'
    )
  })

  it('replaces an existing section param and drops the hash', () => {
    assert.equal(
      buildSectionUrl('http://localhost:3000/faculties/H10?section=bachelor&tab=2#foo', 'master'),
      'http://localhost:3000/faculties/H10?section=master&tab=2'
    )
  })
})
