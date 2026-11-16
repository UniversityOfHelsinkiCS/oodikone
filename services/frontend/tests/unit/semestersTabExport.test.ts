import { assert, describe, it } from 'vitest'

import { getSemestersExcelRows } from '@/components/ColorizedCoursesTable/SemestersTab/excel'
import type { Name } from '@oodikone/shared/types'

const getTextInFinnish = (name: Name) => name.fi

const semesters = [
  { semestercode: 135, name: { fi: 'Syksy 2017', en: 'Autumn 2017' } },
  { semestercode: 136, name: { fi: 'Kevät 2018', en: 'Spring 2018' } },
]

const courses = [
  {
    code: 'MAT01',
    name: { fi: 'Matematiikan alkeet', en: 'Basics of mathematics' },
    bySemesters: {
      completions: 7,
      enrollments: 9,
      135: { completions: 3, enrollments: 4 },
      136: { completions: 4, enrollments: 5 },
    },
  },
]

void describe('getSemestersExcelRows', () => {
  void it('includes the course name in the language of the app', () => {
    const [row] = getSemestersExcelRows(courses, semesters, 'completions', getTextInFinnish)

    assert.deepEqual(row, {
      Course: 'MAT01',
      Name: 'Matematiikan alkeet',
      'Syksy 2017': 3,
      'Kevät 2018': 4,
      Total: 7,
    })
  })

  void it('uses the selected number mode and defaults missing semesters to zero', () => {
    const [row] = getSemestersExcelRows(
      [{ ...courses[0], bySemesters: { enrollments: 4, 135: { enrollments: 4 } } }],
      semesters,
      'enrollments',
      getTextInFinnish
    )

    assert.deepEqual(row, {
      Course: 'MAT01',
      Name: 'Matematiikan alkeet',
      'Syksy 2017': 4,
      'Kevät 2018': 0,
      Total: 4,
    })
  })

  void it('exports only the courses it is given', () => {
    const rows = getSemestersExcelRows([], semesters, 'completions', getTextInFinnish)

    assert.deepEqual(rows, [])
  })
})
