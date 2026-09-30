import { assert, describe, it } from 'vitest'

import {
  getGroupIdToExportKey,
  renameKeys,
} from '@/components/PopulationComponents/Students/Table/CoursesTab/excelExport'

const createModules = (modules: Record<string, [code: string, groupId: string][]>) =>
  new Map(
    Object.entries(modules).map(([parentCode, courses]) => [
      parentCode,
      { courses: courses.map(([code, groupId]) => ({ code, groupId })) },
    ])
  )

void describe('getGroupIdToExportKey', () => {
  void it('maps each course groupId to its course code', () => {
    const modules = createModules({
      MOD1: [
        ['TKT10001', 'otm-1'],
        ['TKT10002', 'otm-2'],
      ],
      MOD2: [['MAT11001', 'otm-3']],
    })

    assert.deepEqual(getGroupIdToExportKey(modules), {
      'otm-1': 'TKT10001',
      'otm-2': 'TKT10002',
      'otm-3': 'MAT11001',
    })
  })

  void it('uses the first code when the same groupId appears under several modules', () => {
    const modules = createModules({
      MOD1: [['TKT10001', 'otm-1']],
      MOD2: [['TKT10001-OLD', 'otm-1']],
    })

    assert.deepEqual(getGroupIdToExportKey(modules), { 'otm-1': 'TKT10001' })
  })

  void it('keeps keys unique when separate groupIds share a code', () => {
    const modules = createModules({
      MOD1: [['TKT10001', 'otm-1']],
      MOD2: [['TKT10001', 'otm-2']],
    })

    assert.deepEqual(getGroupIdToExportKey(modules), {
      'otm-1': 'TKT10001',
      'otm-2': 'TKT10001 (otm-2)',
    })
  })

  void it('returns an empty map when there are no modules', () => {
    assert.deepEqual(getGroupIdToExportKey(new Map()), {})
  })
})

void describe('renameKeys', () => {
  void it('renames mapped keys and keeps other keys and all values unchanged', () => {
    const course = { grade: '5', exportValue: '5' }
    const row = { studentNumber: '123456789', totalPassed: 1, 'otm-1': course }

    assert.deepEqual(renameKeys(row, { 'otm-1': 'TKT10001' }), {
      studentNumber: '123456789',
      totalPassed: 1,
      TKT10001: course,
    })
  })
})
