import { describe, expect, it } from 'vitest'

import './initTests.js'

import { mapTeacher } from '@/updater/mapper.js'

describe('mapTeacher', () => {
  it('combines last and first names when present', () => {
    expect(mapTeacher({ id: 'p1', last_name: 'Smith', first_names: 'John' })).toEqual({
      id: 'p1',
      name: 'Smith John',
    })
  })

  it('falls back to just the last name when first names are missing', () => {
    expect(mapTeacher({ id: 'p2', last_name: 'Doe' })).toEqual({ id: 'p2', name: 'Doe' })
  })
})
