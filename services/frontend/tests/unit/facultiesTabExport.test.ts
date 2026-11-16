import { assert, describe, it } from 'vitest'

import { getFacultiesExcelRows } from '@/components/ColorizedCoursesTable/FacultiesTab/excel'
import type { Name } from '@oodikone/shared/types'

const getTextInFinnish = (name: Name) => name.fi

const faculties = ['H10', 'H50']

const courses = [
  {
    code: 'KK-ENG01',
    name: { fi: 'Englannin alkeet', en: 'Basics of English' },
    bySemesters: {
      cellStats: { H10: { completions: 3, enrollments: 4 } },
      facultiesTotal: { completions: 3, enrollments: 4 },
    },
  },
]

void describe('getFacultiesExcelRows', () => {
  void it('includes the course name in the language of the app', () => {
    const [row] = getFacultiesExcelRows(courses, faculties, 'completions', getTextInFinnish)

    assert.deepEqual(row, { Course: 'KK-ENG01', Name: 'Englannin alkeet', H10: 3, H50: 0, Total: 3 })
  })

  void it('uses the selected number mode', () => {
    const [row] = getFacultiesExcelRows(courses, faculties, 'enrollments', getTextInFinnish)

    assert.deepEqual(row, { Course: 'KK-ENG01', Name: 'Englannin alkeet', H10: 4, H50: 0, Total: 4 })
  })

  void it('exports only the courses it is given', () => {
    assert.deepEqual(getFacultiesExcelRows([], faculties, 'completions', getTextInFinnish), [])
  })
})
