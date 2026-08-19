import { assert, describe, it } from 'vitest'

import { admissionTypeFilter, filter } from '@/components/FilterView/filters/admissionType'

import { createStudent, createStudyRight, createStudyRightElement } from './helpers'

const ARGS = { programme: 'KH50_001' }

void describe('admissionTypeFilter filter()', () => {
  void it('should match a student whose admission type equals the filtered value', () => {
    const student = createStudent({ studyRights: [createStudyRight({ admissionType: 'regular' })] })

    assert.strictEqual(filter('KH50_001', 'regular')(student), true)
  })

  void it('should not match a student whose admission type differs from the given value', () => {
    const student = createStudent({ studyRights: [createStudyRight({ admissionType: 'regular' })] })

    assert.strictEqual(filter('KH50_001', 'open-studies')(student), false)
  })

  void it('should match a student with no admission type when value is null', () => {
    const student = createStudent({ studyRights: [createStudyRight({ admissionType: '' })] })

    assert.strictEqual(filter('KH50_001', null)(student), true)
  })

  void it('should ignore study rights that are cancelled', () => {
    const student = createStudent({
      studyRights: [createStudyRight({ admissionType: 'regular', cancelled: true })],
    })

    assert.strictEqual(filter('KH50_001', 'regular')(student), false)
  })

  // FIXME: This should not fail!!
  void it.fails('should not ignore study rights that are cancelled but student has graduated', () => {
    const student = createStudent({
      studyRights: [
        createStudyRight({
          admissionType: 'regular',
          cancelled: true,
          studyRightElements: [createStudyRightElement({ graduated: true })],
        }),
      ],
    })

    assert.strictEqual(filter('KH50_001', 'regular')(student), true)
  })
})

void describe('admissionTypeFilter createFilter()', () => {
  void it('should include students matching the selected admission type', () => {
    const student = createStudent({ studyRights: [createStudyRight({ admissionType: 'regular' })] })

    const result = admissionTypeFilter(ARGS).filter(student, {
      args: ARGS,
      options: { selected: 'regular' },
      precomputed: {},
    })

    assert.strictEqual(result, true)
  })

  void it('should include students with no admission type when "Ei valintatapaa" is selected', () => {
    const student = createStudent({ studyRights: [createStudyRight({ admissionType: '' })] })

    const result = admissionTypeFilter(ARGS).filter(student, {
      args: ARGS,
      options: { selected: 'Ei valintatapaa' },
      precomputed: {},
    })

    assert.strictEqual(result, true)
  })

  void it('isActive should match filter state', () => {
    assert.strictEqual(admissionTypeFilter(ARGS).isActive({ selected: '' }, undefined), false)
    assert.strictEqual(admissionTypeFilter(ARGS).isActive({ selected: 'regular' }, undefined), true)
  })
})
