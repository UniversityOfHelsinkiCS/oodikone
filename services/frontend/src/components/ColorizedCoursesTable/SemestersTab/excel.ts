import type { Name } from '@oodikone/shared/types'

export type NumberMode = 'completions' | 'enrollments' | 'difference' | 'rejected'
export type Stats = Partial<Record<NumberMode, number>>

export type SemestersTabCourse = {
  code: string
  name: Name
  bySemesters: Stats & Record<number, Stats | undefined>
}

type Semester = { name: Name; semestercode: number }

export const COURSE_EXCEL_KEYS = ['Course', 'Name']

export const getSemestersExcelRows = (
  courses: SemestersTabCourse[],
  semesters: Semester[],
  numberMode: NumberMode,
  getTextIn: (name: Name) => string | null | undefined
): Record<string, string | number | undefined>[] =>
  courses.map(({ code, name, bySemesters }) => ({
    Course: code,
    Name: getTextIn(name) ?? '',
    ...Object.fromEntries(
      semesters.map(({ name, semestercode }) => [`${getTextIn(name)}`, bySemesters[semestercode]?.[numberMode] ?? 0])
    ),
    Total: bySemesters[numberMode],
  }))
