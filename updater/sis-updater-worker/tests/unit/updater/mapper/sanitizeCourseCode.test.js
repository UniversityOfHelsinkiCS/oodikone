import { describe, expect, it } from 'vitest'

import './initTests.js'

import { sanitizeCourseCode } from '@/updater/mapper.js'

describe('sanitizeCourseCode', () => {
  it('returns null for falsy input', () => {
    expect(sanitizeCourseCode(null)).toBeNull()
    expect(sanitizeCourseCode('')).toBeNull()
  })

  it('returns the code as-is when there is no surrogate suffix', () => {
    expect(sanitizeCourseCode('TKT10')).toBe('TKT10')
  })

  it('keeps a short second segment', () => {
    expect(sanitizeCourseCode('a1b2-c3d4')).toBe('a1b2-c3d4')
  })

  it('drops a long (Oodi surrogate) second segment', () => {
    expect(sanitizeCourseCode('TKT10-123456789')).toBe('TKT10')
  })
})
