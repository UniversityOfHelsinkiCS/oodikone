import { describe, expect, it } from 'vitest'

import './initTests.js'

import { isModule } from '@/updater/mapper.js'

describe('isModule', () => {
  it('is true for module attainment types', () => {
    expect(isModule('ModuleAttainment')).toBe(true)
    expect(isModule('CustomModuleAttainment')).toBe(true)
    expect(isModule('DegreeProgrammeAttainment')).toBe(true)
  })

  it('is false for course unit attainment types', () => {
    expect(isModule('CourseUnitAttainment')).toBe(false)
    expect(isModule('CustomCourseUnitAttainment')).toBe(false)
  })
})
