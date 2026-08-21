import { assert, describe, it } from 'vitest'

import { FormattedStudent } from '@oodikone/shared/types/studentData'

import { createStudent } from '@oodikone/shared/test/utils'

const { citizenshipFilter } = await import('@/components/FilterView/filters/citizenship')

const filterStudent = (student: FormattedStudent, selected: string) =>
  citizenshipFilter().filter(student, { args: undefined, options: { selected }, precomputed: null })

void describe('citizenshipFilter', () => {
  void it('should keep a student who has the selected citizenship', () => {
    const student = createStudent({ citizenships: [{ fi: 'Suomi', en: 'Finland', sv: 'Finland' }] })

    assert.strictEqual(filterStudent(student, 'Finland'), true)
  })

  void it('should exclude a student who does not have the selected citizenship', () => {
    const student = createStudent({ citizenships: [{ fi: 'Ruotsi', en: 'Sweden', sv: 'Sverige' }] })

    assert.strictEqual(filterStudent(student, 'Finland'), false)
  })

  void it('should keep a student with multiple citizenships if one of them matches', () => {
    const student = createStudent({
      citizenships: [
        { fi: 'Ruotsi', en: 'Sweden', sv: 'Sverige' },
        { fi: 'Suomi', en: 'Finland', sv: 'Finland' },
      ],
    })

    assert.strictEqual(filterStudent(student, 'Finland'), true)
  })

  void it('isActive should match the filter state', () => {
    assert.strictEqual(citizenshipFilter().isActive({ selected: '' }, undefined), false)
    assert.strictEqual(citizenshipFilter().isActive({ selected: 'Finland' }, undefined), true)
  })
})
